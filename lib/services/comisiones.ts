import { createClient } from '@/lib/supabase/server'
import { startOfYear, endOfYear } from 'date-fns'

export async function getUsedDays(trabajadorId: string, year: number) {
    const supabase = await createClient()
    const start = startOfYear(new Date(year, 0, 1)).toISOString()
    const end = endOfYear(new Date(year, 0, 1)).toISOString()

    const { data, error } = await supabase
        .from('comisiones_sindicales')
        .select('dias_usados')
        .eq('trabajador_id', trabajadorId)
        .gte('fecha_inicio', start)
        .lte('fecha_inicio', end)

    if (error) {
        console.error("Error fetching used days:", error)
        return 0
    }

    return data.reduce((acc, curr) => acc + curr.dias_usados, 0)
}

export async function createComision(data: {
    trabajador_id: string
    fecha_inicio: string
    fecha_fin: string
    dias_usados: number
    motivo?: string
}) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('comisiones_sindicales')
        .insert([data])

    if (error) throw new Error(error.message)
    return { success: true }
}
