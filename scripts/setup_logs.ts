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

async function createTable() {
    console.log('Intentando crear tabla bitacora_sistema...')

    // RAW SQL is hard from here without RPC. 
    // I'll try to see if I can use a simple rpc or just check if it exists.
    const { data, error } = await supabase.from('bitacora_sistema').select('*').limit(1)

    if (error && error.message.includes('relation "public.bitacora_sistema" does not exist')) {
        console.log('La tabla no existe. Sugiriendo SQL al usuario.')
    } else if (!error) {
        console.log('La tabla ya existe.')
    } else {
        console.log('Error:', error.message)
    }
}

createTable()
