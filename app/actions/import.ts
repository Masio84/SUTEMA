'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as workersService from '@/lib/services/workers'
import { getAdscripciones } from '@/lib/services/adscripciones'

export async function importFromExcel(rows: any[]) {
    try {
        const supabase = await createClient()

        // 1. Fetch all adscripciones for mapping
        const adscripciones = await getAdscripciones()
        const adscMap = new Map(adscripciones.map(a => [a.nombre.toLowerCase().trim(), a.id]))

        let successful = 0
        let skipped = 0
        const total = rows.length

        // 2. Process rows with new mapping
        const validWorkers = rows.map(row => {
            // Mapping AREA -> adscripcion
            const areaName = row['AREA']?.toString().toLowerCase().trim()
            const adscId = areaName ? adscMap.get(areaName) : null

            // Basic validation: name and curp are mandatory
            if (!row['NOMBRE'] || !row['CURP'] || !adscId) {
                skipped++
                return null
            }

            // Logic for children
            const tieneHijosVal = row['TIENE HIJOS']?.toString().toUpperCase().trim()
            const cantidadHijos = parseInt(row['CANTIDAD DE HIJOS']) || 0
            const tieneHijos = (tieneHijosVal === 'SI') || (cantidadHijos > 0)

            return {
                nombre: row['NOMBRE'].toString().trim(),
                apellido_paterno: row['PRIMER APELLIDO']?.toString().trim() || '',
                apellido_materno: row['SEGUNDO APELLIDO']?.toString().trim() || '',
                curp: row['CURP'].toString().trim().toUpperCase(),
                sexo: row['SEXO']?.toString().trim() || 'Masculino',
                estado_civil: row['ESTADO CIVIL']?.toString().trim() || 'Soltero/a',
                telefono: row['TELEFONO']?.toString().trim() || '',
                adscripcion_id: adscId,
                unidad_id: null, // Defaulting to null as AREA maps to adscripcion and Unidad is not specified
                fecha_ingreso: new Date().toISOString(), // Default as Excel doesn't have it
                tiene_hijos: tieneHijos,
                hijos_menores_12: 0, // Default as requested
                calle: row['CALLE']?.toString().trim() || '',
                numero_exterior: row['NUM EXT']?.toString().trim() || '',
                numero_interior: row['NUM INT']?.toString().trim() || '',
                colonia: row['COLONIA']?.toString().trim() || '',
                municipio: row['MUNICIPIO']?.toString().trim() || 'Aguascalientes',
                seccion_ine: row['SECCION']?.toString().trim() || '',
                clave_elector: row['CLAVE DE ELECTOR']?.toString().trim() || '',
                estatus: 'Activo'
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
            skipped: total - successful
        }
    } catch (error: any) {
        console.error('Import Error:', error)
        return { error: error.message || "Error al procesar el archivo" }
    }
}
