'use server'

import * as comisionesService from '@/lib/services/comisiones'
import { revalidatePath } from 'next/cache'

export async function getUsedDays(trabajadorId: string, year: number) {
    return await comisionesService.getUsedDays(trabajadorId, year)
}

export async function registerComision(data: {
    trabajador_id: string
    fecha_inicio: string
    fecha_fin: string
    dias_usados: number
    motivo?: string
}) {
    try {
        await comisionesService.createComision(data)
        revalidatePath('/comisiones')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
