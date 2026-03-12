import { createClient } from '@/lib/supabase/server'

export async function getAutoridades() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('autoridades')
        .select('*')
        .order('nombre', { ascending: true })

    if (error) {
        console.error("Error fetching autoridades:", error)
        return []
    }
    return data
}

export async function createAutoridad(data: {
    nombre: string
    cargo: string
    adscripcion_id?: string | null
    unidad_id?: string | null
    copias: string[]
}) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('autoridades')
        .insert([data])

    if (error) throw new Error(error.message)
    return { success: true }
}

export async function deleteAutoridad(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('autoridades')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    return { success: true }
}
