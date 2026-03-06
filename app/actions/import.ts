'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as workersService from '@/lib/services/workers'
import { getAdscripciones } from '@/lib/services/adscripciones'

// ──────────────────────────────────────────────
// Text helpers
// ──────────────────────────────────────────────

/** Remove accents/diacritics for fuzzy matching */
const removeAccents = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Converts "JUAN PABLO" or "juan pablo" to "Juan Pablo" */
const toTitleCase = (str: string): string =>
    str
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()

// ──────────────────────────────────────────────
// Field normalizers (autocorrect)
// ──────────────────────────────────────────────

/** Normalize sexo: handles abbreviations, typos, incomplete words */
const normalizeSexo = (raw: string): 'Masculino' | 'Femenino' | 'Otro' => {
    if (!raw) return 'Masculino'
    const s = removeAccents(raw.toLowerCase().trim())
    if (/^(m|masc|masculine|hombre|h|masculino)/.test(s)) return 'Masculino'
    if (/^(f|fem|femenino|feme|mujer|w|woman)/.test(s)) return 'Femenino'
    return 'Otro'
}

/**
 * Normalize estado_civil: handles abbreviations, typos, incomplete words
 * DB enum: 'Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión Libre'
 */
const normalizeEstadoCivil = (raw: string): string => {
    if (!raw) return 'Soltero/a'
    const s = removeAccents(raw.toLowerCase().trim())
    if (/^(sol|solt|solter|soltero|soltera)/.test(s)) return 'Soltero/a'
    if (/^(cas|casad|casado|casada)/.test(s)) return 'Casado/a'
    if (/^(div|divorc|divorciad|divorciado|divorciada)/.test(s)) return 'Divorciado/a'
    if (/^(viu|viud|viudo|viuda)/.test(s)) return 'Viudo/a'
    if (/^(uni|union libre|unio|uli|u\.l\.|ul)/.test(s)) return 'Unión Libre'
    return 'Soltero/a' // safe default
}

/**
 * Normalize estatus
 * DB constraint: trabajadores_estatus_check allows 'Activo', 'Inactivo', 'Baja', 'Jubilado'
 */
const normalizeEstatus = (raw: string | null | undefined): string => {
    if (!raw) return 'activo'
    const s = removeAccents(raw.toLowerCase().trim())
    if (/jubil/.test(s)) return 'jubilado'
    if (/baja/.test(s)) return 'baja'
    if (/inact/.test(s)) return 'inactivo'
    return 'activo'
}

/** Normalize tiene_hijos: SI/S/1/YES/any positive number → true, else false */
const normalizeTieneHijos = (raw: string | null | undefined, cantidadHijos: number): boolean => {
    if (cantidadHijos > 0) return true
    if (!raw) return false
    const s = removeAccents(raw.toString().toLowerCase().trim())
    // Numeric string: "2", "3"... means that many children → has children
    const asNum = parseFloat(s)
    if (!isNaN(asNum) && asNum > 0) return true
    return /^(si|s|yes|y|true|t)$/.test(s)
}

// ──────────────────────────────────────────────
// Adscripción fuzzy-matcher
// ──────────────────────────────────────────────

/** Smart matcher using highly distinctive keywords/regex to catch typos */
const getOfficialAdscripcionName = (rawInput: string): string | null => {
    if (!rawInput) return null

    const normalized = removeAccents(rawInput.toLowerCase().trim())

    if (normalized.includes('pabell') || normalized.includes('arteaga')) return 'Hospital General de Pabellón de Arteaga'
    if (normalized.includes('rincon') || normalized.includes('romo')) return 'Hospital General de Rincón de Romo'
    if (normalized.includes('calvill')) return 'Hospital General de Calvillo'
    if (normalized.includes('tercer milenio') || normalized.includes('3er milenio') || normalized.includes('tercer m')) return 'Hospital General Tercer Milenio'
    if (normalized.includes('mujer')) return 'Hospital de la Mujer'

    if (normalized.includes('oficina') || normalized.match(/^o\.?c\.?\b/)) return 'Oficinas Centrales'

    if (normalized.includes('distrito sanitario 1') || normalized.match(/\bds\s*1\b/) || normalized.match(/\bdistrito\s*1\b/) || normalized.includes('sanitario 1')) return 'Distrito Sanitario 1'
    if (normalized.includes('distrito sanitario 2') || normalized.match(/\bds\s*2\b/) || normalized.match(/\bdistrito\s*2\b/) || normalized.includes('sanitario 2')) return 'Distrito Sanitario 2'
    if (normalized.includes('distrito sanitario 3') || normalized.match(/\bds\s*3\b/) || normalized.match(/\bdistrito\s*3\b/) || normalized.includes('sanitario 3')) return 'Distrito Sanitario 3'

    if (normalized.includes('lesp') || normalized.includes('estatal de salud publica')) return 'LESP'
    if (normalized.includes('cets') || normalized.includes('transfusion sanguinea')) return 'CETS'
    if (normalized.includes('vih') || normalized.includes('capacits')) return 'VIH'
    if (normalized.includes('uneme')) return 'UNEME'
    if (normalized.includes('seem') || normalized.includes('emergencias medicas')) return 'SEEM'

    return rawInput // Return verbatim if no keyword matches – hoping for exact DB match later
}

// ──────────────────────────────────────────────
// Parse a date string or serial number safely
// ──────────────────────────────────────────────
const parseDate = (raw: any): string | null => {
    if (!raw) return null
    // Already an ISO string from xlsx (cellDates: true)
    if (typeof raw === 'string') {
        const d = new Date(raw)
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
        return null
    }
    // Excel serial number fallback
    if (typeof raw === 'number') {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30))
        const days = Math.floor(raw)
        const date = new Date(excelEpoch.getTime() + days * 86400000)
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
    }
    return null
}

// ──────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────

export async function importFromExcel(rows: any[]) {
    try {
        const supabase = await createClient()

        // 1. Fetch all adscripciones for mapping
        const adscripciones = await getAdscripciones()
        const adscMap = new Map(adscripciones.map(a => [a.nombre.toLowerCase().trim(), a.id]))

        // 2. Fetch existing CURPs to prevent duplicates
        const { data: existingWorkers } = await supabase.from('trabajadores').select('curp')
        const existingCurps = new Set(existingWorkers?.map(w => w.curp.toUpperCase()) || [])

        let successful = 0
        let duplicates = 0
        let validationSkipped = 0
        const total = rows.length
        const invalidDetails: { fila: number; nombre: string; curp: string; motivo: string }[] = []

        // 3. Process rows
        const validWorkers = rows.map((row, index) => {
            // Case-insensitive key lookup (spaces and underscores normalized)
            const getVal = (searchKey: string): any => {
                const normalKey = searchKey.toUpperCase().replace(/\s/g, '_')
                const foundKey = Object.keys(row).find(
                    k => k.toUpperCase().replace(/\s/g, '_') === normalKey
                )
                return foundKey ? row[foundKey] : null
            }

            // ── CURP ──────────────────────────────────────────
            const curp = getVal('CURP')?.toString().trim().toUpperCase()

            // ── ÁREA / DEPENDENCIA (alias) ─────────────────────
            // "DEPENDENCIA" and "AREA" both point to adscripcion_id
            const rawArea = (getVal('AREA') || getVal('DEPENDENCIA'))?.toString() || ''
            const officialName = getOfficialAdscripcionName(rawArea)
            const adscId = officialName ? adscMap.get(officialName.toLowerCase().trim()) : null

            // ── Mandatory field validation ─────────────────────
            const rawNombre = getVal('NOMBRE')?.toString().trim()
            if (!rawNombre || !curp || !adscId) {
                // Build human-readable reason
                const reasons: string[] = []
                if (!rawNombre) reasons.push('Nombre vacío')
                if (!curp) reasons.push('CURP vacío o faltante')
                if (!adscId) {
                    if (!rawArea) reasons.push('Área/Dependencia no especificada')
                    else reasons.push(`Área "${rawArea}" no reconocida${officialName ? ` (se detectó como "${officialName}" pero no existe en la BD)` : ''}`)
                }
                invalidDetails.push({
                    fila: index + 1,
                    nombre: rawNombre || '(sin nombre)',
                    curp: curp || '(sin CURP)',
                    motivo: reasons.join(' | ')
                })
                validationSkipped++
                return null
            }

            // ── Duplicate check ────────────────────────────────
            if (existingCurps.has(curp)) {
                duplicates++
                return null
            }

            // ── Name fields (title case correction) ───────────
            const nombre = toTitleCase(rawNombre)
            const apellidoPaterno = toTitleCase(
                (getVal('PRIMER APELLIDO') || getVal('APELLIDO PATERNO'))?.toString().trim() || ''
            )
            const apellidoMaterno = toTitleCase(
                (getVal('SEGUNDO APELLIDO') || getVal('APELLIDO MATERNO'))?.toString().trim() || ''
            )

            // ── Autocorrected fields ───────────────────────────
            const sexo = normalizeSexo(getVal('SEXO')?.toString() || '')
            const estadoCivil = normalizeEstadoCivil(getVal('ESTADO_CIVIL') || getVal('ESTADO CIVIL') || '')
            const estatus = normalizeEstatus(getVal('ESTATUS')?.toString())

            // ── Hijos ──────────────────────────────────────────
            // Safely parse child count — handles number or string values from Excel
            const rawHijos = getVal('CANTIDAD_DE_HIJOS') || getVal('CANTIDAD DE HIJOS')
            const cantidadHijos = Math.floor(Math.max(0, Number(rawHijos) || 0))
            const rawTieneHijos = getVal('TIENE_HIJOS') || getVal('TIENE HIJOS')
            const tieneHijos = normalizeTieneHijos(rawTieneHijos?.toString(), cantidadHijos)

            // ── Fecha nacimiento ───────────────────────────────
            const fechaNacimientoRaw = getVal('FECHA_DE_NACIMIENTO') || getVal('FECHA DE NACIMIENTO')
            const fechaNacimiento = parseDate(fechaNacimientoRaw)

            // ── Address ───────────────────────────────────────
            const calle = toTitleCase(getVal('CALLE')?.toString().trim() || '')
            const colonia = toTitleCase(getVal('COLONIA')?.toString().trim() || '')
            const municipio = toTitleCase(getVal('MUNICIPIO')?.toString().trim() || 'Aguascalientes')
            const numExt = getVal('NUM_EXT') || getVal('NUM EXT') || getVal('NUMERO EXTERIOR') || ''
            const numInt = getVal('NUM_INT') || getVal('NUM INT') || getVal('NUMERO INTERIOR') || ''

            // ── INE ───────────────────────────────────────────
            const seccionIne = (getVal('SECCION')?.toString().trim() || '')
            const claveElector = (getVal('CLAVE_DE_ELECTOR') || getVal('CLAVE DE ELECTOR'))?.toString().trim() || ''

            return {
                nombre,
                apellido_paterno: apellidoPaterno,
                apellido_materno: apellidoMaterno,
                curp,
                sexo,
                estado_civil: estadoCivil,
                telefono: getVal('TELEFONO')?.toString().trim() || '',
                fecha_nacimiento: fechaNacimiento,
                adscripcion_id: adscId,
                unidad_id: null,
                fecha_ingreso: new Date().toISOString().split('T')[0],
                tiene_hijos: tieneHijos === true,
                hijos_menores_12: cantidadHijos > 0,   // BOOLEAN in real Supabase DB
                calle,
                numero_exterior: numExt.toString().trim(),
                numero_interior: numInt.toString().trim(),
                colonia,
                municipio,
                seccion_ine: seccionIne,
                clave_elector: claveElector,
                estatus,
            }
        }).filter(Boolean)

        if (validWorkers.length > 0) {
            const result = await workersService.importWorkers(validWorkers)
            successful = result.count
        }

        revalidatePath('/dashboard')
        revalidatePath('/consultas')

        return {
            success: true,
            total,
            successful,
            duplicates,
            validationSkipped,
            invalidDetails,
        }
    } catch (error: any) {
        console.error('Import Error:', error)
        return { error: `ERROR_TECH: ${error.message} - ${error.stack || ''}` }
    }
}
