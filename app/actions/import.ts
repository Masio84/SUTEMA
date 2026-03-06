'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as workersService from '@/lib/services/workers'
import { getAdscripciones } from '@/lib/services/adscripciones'

// Helper to remove accents/diacritics for easier matching
const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

// Smart matcher dictionary using highly distinctive keywords/regex to catch typos
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

    return rawInput // Return verbatim if no keyword matches, hoping for exact match later
}

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

        // 3. Process rows with mapping and duplicate check
        const validWorkers = rows.map((row, index) => {
            // Helper to get value from row with case-insensitive key
            const getVal = (searchKey: string) => {
                const key = Object.keys(row).find(k => k.toUpperCase().replace(/\s/g, '_') === searchKey.toUpperCase().replace(/\s/g, '_'))
                return key ? row[key] : null
            }

            const curp = getVal('CURP')?.toString().trim().toUpperCase()

            // Intelligent Area Normalization
            const rawArea = getVal('AREA')?.toString() || ''
            const officialName = getOfficialAdscripcionName(rawArea)
            const adscId = officialName ? adscMap.get(officialName.toLowerCase().trim()) : null

            // Validation: name, curp and area are mandatory
            if (!getVal('NOMBRE') || !curp || !adscId) {
                if (rawArea && !adscId) {
                    console.warn(`[Row ${index + 1}] Warning: Area "${rawArea}" normalized to "${officialName}" could not be mapped to a valid ID.`);
                }
                validationSkipped++
                return null
            }

            // Duplicate check
            if (existingCurps.has(curp)) {
                duplicates++
                return null
            }

            // Logic for children
            const tieneHijosVal = getVal('TIENE HIJOS')?.toString().toUpperCase().trim()
            const cantidadHijos = parseInt(getVal('CANTIDAD DE HIJOS')) || 0
            const tieneHijos = (tieneHijosVal === 'SI') || (cantidadHijos > 0)

            // Intelligent ESTATUS mapping or default to 'Activo'
            // DB Constraint: trabajadores_estatus_check allows only "Activo" or "Jubilado"
            let estatus = 'activo'
            const rawEstatus = getVal('ESTATUS')
            if (rawEstatus) {
                const s = rawEstatus.toString().trim().toLowerCase()
                if (s.includes('jubil')) {
                    estatus = 'jubilado'
                } else {
                    estatus = 'activo'
                }
            }
            console.log("Worker estatus:", estatus)

            return {
                nombre: getVal('NOMBRE').toString().trim(),
                apellido_paterno: (getVal('PRIMER APELLIDO') || getVal('APELLIDO PATERNO'))?.toString().trim() || '',
                apellido_materno: (getVal('SEGUNDO APELLIDO') || getVal('APELLIDO MATERNO'))?.toString().trim() || '',
                curp: curp,
                sexo: getVal('SEXO')?.toString().trim() || 'Masculino',
                estado_civil: getVal('ESTADO CIVIL')?.toString().trim() || 'Soltero/a',
                telefono: getVal('TELEFONO')?.toString().trim() || '',
                adscripcion_id: adscId,
                unidad_id: null,
                fecha_ingreso: new Date().toISOString().split('T')[0],
                tiene_hijos: tieneHijos,
                hijos_menores_12: 0,
                calle: getVal('CALLE')?.toString().trim() || '',
                numero_exterior: getVal('NUM EXT')?.toString().trim() || '',
                numero_interior: getVal('NUM INT')?.toString().trim() || '',
                colonia: getVal('COLONIA')?.toString().trim() || '',
                municipio: getVal('MUNICIPIO')?.toString().trim() || 'Aguascalientes',
                seccion_ine: getVal('SECCION')?.toString().trim() || '',
                clave_elector: getVal('CLAVE DE ELECTOR')?.toString().trim() || '',
                estatus: estatus
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
            validationSkipped
        }
    } catch (error: any) {
        console.error('Import Error:', error)
        return { error: `ERROR_TECH: ${error.message} - ${error.stack || ''}` }
    }
}
