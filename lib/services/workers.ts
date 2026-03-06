import { createClient } from '@/lib/supabase/server'
import { WorkerFormValues } from '@/lib/validations/worker'

export type WorkerFilters = {
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
}

export async function getWorkersOverview(params: WorkerFilters = {}) {
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

    let query = supabase.from('trabajadores').select('*, adscripciones(nombre), unidades(nombre)', { count: 'exact' })

    if (search) {
        query = query.or(`nombre.ilike.%${search}%,apellido_paterno.ilike.%${search}%,apellido_materno.ilike.%${search}%,curp.ilike.%${search}%,telefono.ilike.%${search}%,municipio.ilike.%${search}%,seccion_ine.ilike.%${search}%`)
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

    const from = (page - 1) * perPage
    const to = from + perPage - 1
    query = query.range(from, to).order(sortCol, { ascending: sortOrder === 'asc' })

    const { data, error, count } = await query

    if (error) {
        throw new Error(error.message)
    }

    return { data: (data || []) as any[], count: count || 0 }
}

export async function getWorkerById(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('trabajadores')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null

    return {
        ...data,
        fecha_ingreso: new Date(data.fecha_ingreso),
    }
}

export async function createWorker(data: WorkerFormValues) {
    const supabase = await createClient()

    const { error } = await supabase.from('trabajadores').insert([
        {
            ...data,
            fecha_ingreso: data.fecha_ingreso.toISOString(),
        },
    ])

    if (error) throw new Error(error.message)
    return { success: true }
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

    if (error) throw new Error(error.message)
    return { success: true }
}

export async function deleteWorker(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('trabajadores').delete().eq('id', id)

    if (error) throw new Error(error.message)
    return { success: true }
}

export async function importWorkers(workers: any[]) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('trabajadores')
        .insert(workers)

    if (error) throw new Error(error.message)
    return { success: true, count: workers.length }
}

export async function getDashboardStats() {
    const supabase = await createClient()

    const queries = [
        supabase.from('trabajadores').select('*', { count: 'exact', head: true }),
        supabase.from('trabajadores').select('*', { count: 'exact', head: true }).eq('estatus', 'activo'),
        supabase.from('trabajadores').select('*', { count: 'exact', head: true }).eq('estatus', 'jubilado'),
        supabase.from('trabajadores').select('*', { count: 'exact', head: true }).gt('hijos_menores_12', 0),
        supabase.from('adscripciones').select('nombre, trabajadores(id)')
    ]

    const [totalRes, activosRes, jubiladosRes, conHijosRes, adscRes] = await Promise.all(queries)

    return {
        total: totalRes.count || 0,
        activos: activosRes.count || 0,
        jubilados: jubiladosRes.count || 0,
        conHijos: conHijosRes.count || 0,
        stats: {
            adscDistrib: (adscRes.data as any[])?.map(a => ({
                name: a.nombre,
                count: a.trabajadores?.length || 0
            })) || []
        }
    }
}
