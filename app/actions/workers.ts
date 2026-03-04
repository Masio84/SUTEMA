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

export async function getWorkers(search?: string) {
    const supabase = await createClient()

    let query = supabase.from('trabajadores').select('*')

    if (search) {
        query = query.or(`nombre.ilike.%${search}%,apellido_paterno.ilike.%${search}%,curp.ilike.%${search}%`)
    }

    const { data, error } = await query.order('nombre', { ascending: true })

    if (error) {
        console.error(error)
        return []
    }

    return (data || []) as any[]
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
