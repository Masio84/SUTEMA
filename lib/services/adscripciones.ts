import { createClient } from '@/lib/supabase/server'

export async function getAdscripciones() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('adscripciones')
        .select('*')
        .order('nombre', { ascending: true })

    if (error) {
        console.error('Error fetching adscripciones:', error)
        return []
    }

    return data
}

export async function getUnidades(adscripcionId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('unidades')
        .select('*')
        .eq('adscripcion_id', adscripcionId)
        .order('nombre', { ascending: true })

    if (error) {
        console.error('Error fetching unidades:', error)
        return []
    }

    return data
}
