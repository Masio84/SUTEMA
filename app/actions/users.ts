'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type UserSystem = {
    id: string
    nombre_completo: string
    rol: 'admin' | 'capturista'
    activo: boolean
    email?: string
}

export async function getUsers() {
    const supabase = await createClient()

    // First get profiles from public table
    const { data: profiles, error: profileError } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .order('fecha_creacion', { ascending: false })

    if (profileError) {
        console.error(profileError)
        return []
    }

    // We can't fetch auth emails easily without service role
    // So we show the profiles. If we had service role, we could join with auth.users
    return profiles as UserSystem[]
}

export async function createUser(data: {
    email: string
    nombre_completo: string
    rol: 'admin' | 'capturista'
}) {
    const supabase = await createClient()

    // IMPORTANT: For real production, we need a separate Supabase client 
    // with SERVICE_ROLE_KEY to call auth.admin.createUser.
    // Standard signUp will trigger email confirmation and won't work 
    // easily inside an admin dash for 'other' users.

    // As a workaround for this MVP context, we'll try to sign them up standardly.
    // BUT the user must understand that creating users for others requires service role.

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: 'TemporaryPass123!', // Admin sets a default or generates one
        options: {
            data: {
                full_name: data.nombre_completo
            }
        }
    })

    if (authError) return { error: authError.message }

    if (authData.user) {
        const { error: profileError } = await supabase
            .from('usuarios_sistema')
            .insert({
                id: authData.user.id,
                nombre_completo: data.nombre_completo,
                email: data.email,
                rol: data.rol,
                activo: true
            })

        if (profileError) return { error: profileError.message }
    }

    revalidatePath('/configuracion')
    return { success: true }
}

export async function updateUser(id: string, data: {
    nombre_completo: string
    rol: 'admin' | 'capturista'
    activo: boolean
}) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('usuarios_sistema')
        .update({
            nombre_completo: data.nombre_completo,
            rol: data.rol,
            activo: data.activo
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/configuracion')
    return { success: true }
}

export async function deleteUser(id: string) {
    const supabase = await createClient()

    // Again, auth user deletion usually requires service role.
    // We delete from the public profiles first.
    const { error } = await supabase
        .from('usuarios_sistema')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/configuracion')
    return { success: true }
}

export async function resetPassword(email: string) {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })
    if (error) return { error: error.message }
    return { success: true, message: "Enlace de restablecimiento enviado al correo." }
}
