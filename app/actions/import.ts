'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as workersService from '@/lib/services/workers'
import { getAdscripciones } from '@/lib/services/adscripciones'

const adscripcionAliases: Record<string, string> = {
    "hospital calvillo": "Hospital General de Calvillo",
    "hosp calvillo": "Hospital General de Calvillo",
    "hg calvillo": "Hospital General de Calvillo",
    "hospital general calvillo": "Hospital General de Calvillo",
    "hospital mujer": "Hospital de la Mujer",
    "hospital de la mujer": "Hospital de la Mujer",
    "oficinas centrales": "Oficinas Centrales",
    "oc": "Oficinas Centrales",
    "distrito sanitario 1": "Distrito Sanitario 1",
    "ds1": "Distrito Sanitario 1",
    "distrito sanitario 2": "Distrito Sanitario 2",
    "ds2": "Distrito Sanitario 2",
    "distrito sanitario 3": "Distrito Sanitario 3",
    "ds3": "Distrito Sanitario 3"
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
            const rawArea = getVal('AREA')?.toString().toLowerCase().trim()
            const officialName = rawArea ? (adscripcionAliases[rawArea] || rawArea) : null
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

            // Mapping ESTATUS or default to Activo
            let estatus = 'Activo'
            const rawEstatus = getVal('ESTATUS')
            if (rawEstatus) {
                const rowEstatus = rawEstatus.toString().trim()
                const normalized = rowEstatus.charAt(0).toUpperCase() + rowEstatus.slice(1).toLowerCase()
                if (['Activo', 'Inactivo', 'Baja', 'Jubilado'].includes(normalized)) {
                    estatus = normalized
                }
            }

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
                fecha_ingreso: new Date().toISOString(),
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
        return { error: error.message || "Error al procesar el archivo" }
    }
}
