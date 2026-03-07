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

async function checkAudit() {
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'auditoria_ediciones' })
    // If RPC doesn't exist, try select
    if (error) {
        const { data: cols, error: err2 } = await supabase.from('auditoria_ediciones').select('*').limit(1)
        console.log('Sample data or Error:', cols || err2)
    } else {
        console.log('Table Info:', data)
    }
}

checkAudit()
