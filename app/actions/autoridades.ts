'use server'

import * as autoridadesService from '@/lib/services/autoridades'
import { revalidatePath } from 'next/cache'

export async function getAutoridades() {
    return await autoridadesService.getAutoridades()
}

export async function createAutoridad(data: {
    nombre: string
    cargo: string
    adscripcion_id?: string | null
    unidad_id?: string | null
    copias: string[]
}) {
    try {
        await autoridadesService.createAutoridad(data)
        revalidatePath('/comisiones')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteAutoridad(id: string) {
    try {
        await autoridadesService.deleteAutoridad(id)
        revalidatePath('/comisiones')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
