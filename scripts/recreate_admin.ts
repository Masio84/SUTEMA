import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Manual env parsing
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8')
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=')
            if (key && value) process.env[key.trim()] = value.trim()
        })
    }
}
loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function recreateAdmin() {
    const email = 'masio.tds@gmail.com'
    const password = 'Dianita9'
    const nombre = 'Administrador Sistema'

    console.log(`Intentando registrar usuario: ${email}...`)

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: nombre
            }
        }
    })

    let userId = data.user?.id

    if (error) {
        if (error.message.includes('already registered')) {
            console.log('El usuario ya existe en Auth. Intentando obtener ID via login...')
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (signInError) {
                console.error('Error al iniciar sesión:', signInError.message)
                return
            }
            userId = signInData.user?.id
        } else {
            console.error('Error en signUp:', error.message)
            return
        }
    }

    if (userId) {
        console.log('ID de usuario obtenido:', userId)
        await createProfile(userId, nombre, email)
    } else {
        console.log('El usuario se creó pero requiere confirmación por email para obtener el ID.')
        console.log('Por favor confirma el correo electrónico y luego ejecuta este script de nuevo.')
    }
}

async function createProfile(id: string, nombre: string, email: string) {
    console.log(`Insertando perfil en usuarios_sistema para ID: ${id}...`)

    const { error } = await supabase
        .from('usuarios_sistema')
        .upsert({
            id,
            nombre,
            usuario: email,
            rol: 'admin',
            activo: true
        })

    if (error) {
        console.error('Error al insertar perfil:', error.message)
        console.log('\n--- COMANDO SQL PARA CONSOLA DE SUPABASE ---')
        console.log('Si el script falló por permisos de RLS, copia y pega esto en el SQL Editor de Supabase:')
        console.log(`INSERT INTO usuarios_sistema (id, nombre, usuario, rol, activo) \nVALUES ('${id}', '${nombre}', '${email}', 'admin', true) \nON CONFLICT (id) DO UPDATE SET rol = 'admin';`)
    } else {
        console.log('¡Éxito! Perfil creado/actualizado como ADMIN.')
    }
}

recreateAdmin()
