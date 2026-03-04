'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { WorkerFormValues } from '@/lib/validations/worker'

export async function createWorker(data: WorkerFormValues) {
    const supabase = await createClient()

    const { error } = await supabase.from('trabajadores').insert([
        {
            ...data,
            fecha_ingreso: data.fecha_ingreso.toISOString(),
        },
    ])

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/consultas')
    redirect('/consultas')
}

export async function updateWorker(id: string, data: WorkerFormValues) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('trabajadores')
        .update({
            ...data,
            fecha_ingreso: data.fecha_ingreso.toISOString(),
            fecha_actualizacion: new Date().toISOString(),
        })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/editar/${id}`)
    revalidatePath('/consultas')
    return { success: true }
}

export async function getWorkerById(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('trabajadores')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        return null
    }

    return {
        ...data,
        fecha_ingreso: new Date(data.fecha_ingreso),
    }
}

export async function getWorkers(params: {
    search?: string;
    adscripcion?: string;
    estatus?: string;
    hijos_menores_12?: boolean;
    seniority_min?: number;
    seniority_max?: number;
    page?: number;
    perPage?: number;
    sortCol?: string;
    sortOrder?: 'asc' | 'desc';
} = {}) {
    const {
        search,
        adscripcion,
        estatus,
        hijos_menores_12,
        seniority_min,
        seniority_max,
        page = 1,
        perPage = 50,
        sortCol = 'nombre',
        sortOrder = 'asc'
    } = params

    const supabase = await createClient()

    let query = supabase.from('trabajadores').select('*, adscripciones(nombre)', { count: 'exact' })

    if (search) {
        query = query.or(`nombre.ilike.%${search}%,apellido_paterno.ilike.%${search}%,curp.ilike.%${search}%`)
    }

    if (adscripcion && adscripcion !== 'all') {
        query = query.eq('adscripcion_id', adscripcion)
    }

    if (estatus && estatus !== 'all') {
        query = query.eq('estatus', estatus)
    }

    if (hijos_menores_12) {
        query = query.gt('hijos_menores_12', 0)
    }

    // Seniority filter logic
    if (seniority_min !== undefined || seniority_max !== undefined) {
        const today = new Date()
        if (seniority_min !== undefined) {
            const minDate = new Date(today.getFullYear() - seniority_min, today.getMonth(), today.getDate())
            query = query.lte('fecha_ingreso', minDate.toISOString().split('T')[0])
        }
        if (seniority_max !== undefined) {
            const maxDate = new Date(today.getFullYear() - (seniority_max + 1), today.getMonth(), today.getDate())
            query = query.gte('fecha_ingreso', maxDate.toISOString().split('T')[0])
        }
    }

    // Pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    query = query.range(from, to).order(sortCol, { ascending: sortOrder === 'asc' })

    const { data, error, count } = await query

    if (error) {
        console.error(error)
        return { data: [], count: 0 }
    }

    return { data: (data || []) as any[], count: count || 0 }
}

export async function getAdscripciones() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('adscripciones').select('*').order('nombre')
    if (error) return []
    return data
}

export async function deleteWorker(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('trabajadores').delete().eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/consultas')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function getDashboardStats() {
    const supabase = await createClient()

    const { count: total, error: e1 } = await supabase
        .from('trabajadores')
        .select('*', { count: 'exact', head: true })

    const { count: activos, error: e2 } = await supabase
        .from('trabajadores')
        .select('*', { count: 'exact', head: true })
        .eq('estatus', 'Activo')

    const { count: jubilados, error: e3 } = await supabase
        .from('trabajadores')
        .select('*', { count: 'exact', head: true })
        .eq('estatus', 'Jubilado')

    const { count: conHijos, error: e4 } = await supabase
        .from('trabajadores')
        .select('*', { count: 'exact', head: true })
        .gt('hijos_menores_12', 0)

    // Distribution by Adscripción (simplified for now, ideally group by)
    const { data: adscInfo, error: e5 } = await supabase
        .from('adscripciones')
        .select(`
      nombre,
      trabajadores (id)
    `)

    const adscDistrib = adscInfo?.map(a => ({
        name: a.nombre,
        count: (a.trabajadores as any[]).length
    })) || []

    return {
        total: total || 0,
        activos: activos || 0,
        jubilados: jubilados || 0,
        conHijos: conHijos || 0,
        stats: {
            adscDistrib
        }
    }
}
