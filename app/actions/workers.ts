'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { WorkerFormValues } from '@/lib/validations/worker'
import * as workersService from '@/lib/services/workers'
import * as adscripcionesService from '@/lib/services/adscripciones'

export async function createWorker(data: WorkerFormValues) {
    try {
        await workersService.createWorker(data)
        revalidatePath('/dashboard')
        revalidatePath('/consultas')
    } catch (error: any) {
        return { error: error.message }
    }
    redirect('/consultas')
}

export async function updateWorker(id: string, data: WorkerFormValues) {
    try {
        await workersService.updateWorker(id, data)
        revalidatePath('/dashboard')
        revalidatePath(`/editar/${id}`)
        revalidatePath('/consultas')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getWorkerById(id: string) {
    return await workersService.getWorkerById(id)
}

export async function getWorkers(params: workersService.WorkerFilters = {}) {
    try {
        return await workersService.getWorkersOverview(params)
    } catch (error: any) {
        console.error(error)
        return { data: [], count: 0 }
    }
}

export async function getAdscripciones() {
    return await adscripcionesService.getAdscripciones()
}

export async function getUnidades(adscripcionId: string) {
    return await adscripcionesService.getUnidades(adscripcionId)
}

export async function deleteWorker(id: string) {
    try {
        await workersService.deleteWorker(id)
        revalidatePath('/consultas')
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getDashboardStats() {
    try {
        return await workersService.getDashboardStats()
    } catch (error) {
        console.error(error)
        return {
            total: 0, activos: 0, jubilados: 0, conHijos: 0,
            stats: { adscDistrib: [], adscDetailed: [] }
        }
    }
}

export async function getIncompleteWorkers() {
    try {
        return await workersService.getIncompleteWorkers()
    } catch (error) {
        console.error(error)
        return { workers: [], fieldMissing: {} }
    }
}
