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

async function checkTrabajadores() {
    const { data, error } = await supabase.from('trabajadores').select('*').limit(1)
    if (error) {
        console.error('Error:', error.message)
        return
    }
    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]))
    } else {
        console.log('No data to check columns, trying to get error by selecting a ghost column...')
        const { error: err2 } = await supabase.from('trabajadores').select('fecha_actualizacion').limit(1)
        console.log('Ghost column selection error:', err2?.message)
    }
}

checkTrabajadores()
