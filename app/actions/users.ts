'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const getSiteURL = () => {
    let url =
        process.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production
        process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set on Vercel deployments
        'http://localhost:3000/'
    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`
    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
    return url
}

export type UserSystem = {
    id: string
    nombre: string
    rol: 'admin' | 'capturista'
    activo: boolean
    usuario?: string
}

export async function getUsers() {
    const supabase = await createClient()

    // First get profiles from public table
    const { data: profiles, error: profileError } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .order('created_at', { ascending: false })

    if (profileError) {
        console.error(profileError)
        return []
    }

    return profiles as any[] as UserSystem[]
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
                nombre: data.nombre_completo,
                usuario: data.email,
                rol: data.rol,
                activo: true
            })

        if (profileError) return { error: profileError.message }

        // Trigger invitation (password reset link)
        await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: `${getSiteURL()}reset-password`,
        })
    }

    revalidatePath('/configuracion')
    return { success: true }
}

export async function updatePassword(password: string) {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
        password: password
    })
    if (error) return { error: error.message }
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
            nombre: data.nombre_completo,
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
        redirectTo: `${getSiteURL()}reset-password`,
    })
    if (error) return { error: error.message }
    return { success: true, message: "Enlace de restablecimiento enviado al correo." }
}
