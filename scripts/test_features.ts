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

async function runTest() {
    const email = 'masio.tds@gmail.com'
    const password = 'Dianita9'

    console.log('--- TEST: INICIO DE SESIÓN ---')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (authError) {
        console.error('Error Auth:', authError.message)
        return
    }
    const user = authData.user
    console.log('Sesión iniciada para:', user.email)

    console.log('\n--- TEST: CAMBIO DE NOMBRE ---')
    const newName = 'Jorge Cuellar (Test)'
    const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: newName }
    })

    if (updateError) {
        console.error('Error al actualizar nombre en Auth:', updateError.message)
    } else {
        console.log('Nombre actualizado en Auth a:', newName)
        // Update profile table
        const { error: profError } = await supabase
            .from('usuarios_sistema')
            .update({ nombre: newName })
            .eq('id', user.id)

        if (profError) console.error('Error al actualizar tabla perfil:', profError.message)
        else console.log('Tabla usuarios_sistema actualizada.')
    }

    console.log('\n--- TEST: BITÁCORA ---')
    console.log('Intentando insertar log de prueba...')
    const { error: logError } = await supabase.from('bitacora_sistema').insert({
        usuario_id: user.id,
        accion: 'Test de Sistema',
        detalles: 'Prueba de funcionamiento de bitácora automatizada.'
    })

    if (logError) {
        console.error('Error al insertar log:', logError.message)
        if (logError.message.includes('relation "public.bitacora_sistema" does not exist')) {
            console.log('CONFIRMADO: Falta crear la tabla bitacora_sistema en Supabase.')
        }
    } else {
        console.log('Log insertado correctamente.')
    }

    console.log('\n--- TEST: RECUERDO DE LOGS ---')
    const { data: logs, error: getLogsError } = await supabase
        .from('bitacora_sistema')
        .select('*')
        .eq('usuario_id', user.id)
        .order('fecha', { ascending: false })
        .limit(5)

    if (getLogsError) {
        console.error('Error al leer logs:', getLogsError.message)
    } else {
        console.log('Últimos logs encontrados:', logs.length)
        logs.forEach(l => console.log(`[${l.fecha}] ${l.accion}: ${l.detalles}`))
    }
}

runTest()
