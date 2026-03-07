import { createClient } from '@/lib/supabase/server'
import { WorkerFormValues } from '@/lib/validations/worker'

export type WorkerFilters = {
    search?: string;
    adscripcion?: string;
    estatus?: string;
    municipio?: string;
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

    if (params.municipio && params.municipio !== 'all') {
        query = query.eq('municipio', params.municipio)
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

    // Sanitize fields to match ACTUAL Supabase column types:
    // - tiene_hijos    → BOOLEAN
    // - hijos_menores_12 → BOOLEAN (real DB, not INTEGER as in schema.sql)
    // - estatus        → lowercase ('activo', not 'Activo')
    const safeWorkers = workers.map(w => ({
        ...w,
        tiene_hijos: !!(w.tiene_hijos === true || w.tiene_hijos === 'true' || w.tiene_hijos === 1 || (typeof w.tiene_hijos === 'string' && parseFloat(w.tiene_hijos) > 0) || Number(w.hijos_menores_12) > 0),
        hijos_menores_12: !!(Number(w.hijos_menores_12) > 0),  // BOOLEAN in real DB
        estatus: (() => {
            const s = (w.estatus || 'activo').toLowerCase().trim()
            if (s.includes('jubil')) return 'jubilado'
            if (s.includes('baja')) return 'baja'
            if (s.includes('inact')) return 'inactivo'
            return 'activo'
        })(),
    }))

    const { error } = await supabase
        .from('trabajadores')
        .insert(safeWorkers)

    if (error) throw new Error(error.message)
    return { success: true, count: safeWorkers.length }
}

export async function getDashboardStats() {
    const supabase = await createClient()

    // Fetch summary counts
    const [totalRes, activosRes, jubiladosRes, conHijosRes] = await Promise.all([
        supabase.from('trabajadores').select('*', { count: 'exact', head: true }),
        supabase.from('trabajadores').select('*', { count: 'exact', head: true }).eq('estatus', 'activo'),
        supabase.from('trabajadores').select('*', { count: 'exact', head: true }).eq('estatus', 'jubilado'),
        supabase.from('trabajadores').select('*', { count: 'exact', head: true }).eq('tiene_hijos', true),
    ])

    // Fetch ALL workers with the fields we need for per-adscripcion breakdown
    const { data: allWorkers } = await supabase
        .from('trabajadores')
        .select('adscripcion_id, estatus, tiene_hijos, curp, clave_elector, sexo, telefono, colonia, calle, numero_exterior, municipio, seccion_ine, estado_civil, fecha_nacimiento, adscripciones(nombre)')

    // Fetch adscripciones for naming
    const { data: adscData } = await supabase.from('adscripciones').select('id, nombre').order('nombre')

    // ── Build per-adscripcion stats ──────────────────────────────────────────
    const REQUIRED = ['curp', 'clave_elector', 'sexo', 'telefono', 'colonia', 'calle', 'numero_exterior', 'municipio', 'seccion_ine', 'estado_civil', 'fecha_nacimiento'] as const

    const adscMap: Record<number, {
        name: string; total: number; activos: number; jubilados: number;
        inactivos: number; bajas: number; conHijos: number; incompletos: number
    }> = {}

    // Init buckets from the adscripciones list
    for (const a of (adscData || [])) {
        adscMap[a.id] = { name: a.nombre, total: 0, activos: 0, jubilados: 0, inactivos: 0, bajas: 0, conHijos: 0, incompletos: 0 }
    }

    for (const w of (allWorkers || []) as any[]) {
        const adscId = w.adscripcion_id
        if (!adscMap[adscId]) continue

        const bucket = adscMap[adscId]
        bucket.total++
        if (w.estatus === 'activo') bucket.activos++
        if (w.estatus === 'jubilado') bucket.jubilados++
        if (w.estatus === 'inactivo') bucket.inactivos++
        if (w.estatus === 'baja') bucket.bajas++
        if (w.tiene_hijos) bucket.conHijos++

        const isIncomplete = REQUIRED.some(f => !w[f] || w[f] === '')
        if (isIncomplete) bucket.incompletos++
    }

    const adscDetailed = Object.values(adscMap).filter(a => a.total > 0)
    const adscDistrib = adscDetailed.map(a => ({ name: a.name, count: a.total }))

    return {
        total: totalRes.count || 0,
        activos: activosRes.count || 0,
        jubilados: jubiladosRes.count || 0,
        conHijos: conHijosRes.count || 0,
        stats: { adscDistrib, adscDetailed }
    }
}


// Required fields for a "complete" record (num_interior is optional)
const REQUIRED_FIELDS = [
    'curp', 'clave_elector', 'sexo', 'telefono', 'colonia',
    'calle', 'numero_exterior', 'municipio', 'seccion_ine',
    'estado_civil', 'fecha_nacimiento'
] as const

export async function getIncompleteWorkers() {
    const supabase = await createClient()

    // Fetch all workers with just the fields we need to check
    const { data, error } = await supabase
        .from('trabajadores')
        .select('id, nombre, apellido_paterno, apellido_materno, curp, clave_elector, sexo, telefono, colonia, calle, numero_exterior, municipio, seccion_ine, estado_civil, fecha_nacimiento, adscripciones(nombre)')
        .order('nombre', { ascending: true })

    if (error || !data) return { workers: [], fieldMissing: {} }

    // Compute which workers are incomplete and which fields are missing
    const fieldMissing: Record<string, number> = {}
    REQUIRED_FIELDS.forEach(f => { fieldMissing[f] = 0 })

    const incomplete = data.filter(w => {
        const missingFields: string[] = []
        REQUIRED_FIELDS.forEach(f => {
            const val = (w as any)[f]
            if (!val || val === '') missingFields.push(f)
        })
        if (missingFields.length > 0) {
            missingFields.forEach(f => { fieldMissing[f] = (fieldMissing[f] || 0) + 1 })
            return true
        }
        return false
    }).map(w => {
        const missingFields = REQUIRED_FIELDS.filter(f => {
            const val = (w as any)[f]
            return !val || val === ''
        })
        return { ...w, missingFields }
    })

    return { workers: incomplete, fieldMissing }
}
