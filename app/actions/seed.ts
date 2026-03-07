'use server'

import { createClient } from '@/lib/supabase/server'

export async function seedNewAdscripciones() {
    const supabase = await createClient()

    const newAdscs = [
        { nombre: 'Regulación Sanitaria' },
        { nombre: 'Agua Clara' },
        { nombre: 'CERESO' }
    ]

    const results = []

    for (const adsc of newAdscs) {
        // First check if it exists
        const { data: existing } = await supabase
            .from('adscripciones')
            .select('id')
            .eq('nombre', adsc.nombre)
            .maybeSingle()

        if (existing) {
            results.push(`Adscripción "${adsc.nombre}" already exists.`)
        } else {
            const { data, error } = await supabase
                .from('adscripciones')
                .insert([adsc])
                .select()

            if (error) {
                results.push(`Error inserting "${adsc.nombre}": ${error.message}`)
            } else {
                results.push(`Inserted: "${adsc.nombre}"`)
            }
        }
    }
    return results
}
