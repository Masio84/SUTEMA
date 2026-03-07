import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

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

const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

async function fixUser() {
    const email = 'masio.tds@gmail.com'
    const newId = 'f9970587-6850-416b-be0c-446678eeb488'

    console.log(`Buscando registros con correo ${email} en usuarios_sistema...`)
    const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .eq('usuario', email)

    if (error) {
        console.error('Error al buscar:', error.message)
        return
    }

    console.log('Registros encontrados:', data)

    if (data && data.length > 0) {
        const oldId = data[0].id
        console.log(`Eliminando registro antiguo con ID: ${oldId}...`)
        const { error: delError } = await supabase
            .from('usuarios_sistema')
            .delete()
            .eq('id', oldId)

        if (delError) {
            console.error('Error al eliminar:', delError.message)
            return
        }
    }

    console.log(`Insertando nuevo registro con ID: ${newId}...`)
    const { error: insError } = await supabase
        .from('usuarios_sistema')
        .insert({
            id: newId,
            nombre: 'Administrador Sistema',
            usuario: email,
            rol: 'admin',
            activo: true
        })

    if (insError) {
        console.error('Error al insertar:', insError.message)
        console.log('\n--- COMANDO SQL ---')
        console.log(`DELETE FROM usuarios_sistema WHERE usuario = '${email}';`)
        console.log(`INSERT INTO usuarios_sistema (id, nombre, usuario, rol, activo) VALUES ('${newId}', 'Administrador', '${email}', 'admin', true);`)
    } else {
        console.log('¡Éxito! Usuario restaurado como ADMIN.')
    }
}

fixUser()
