import { createClient } from '@supabase/supabase-js'

async function tryInsert(estatus: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    const worker = {
        nombre: "TestEstatus",
        apellido_paterno: "Test",
        curp: "TEST000000AAAAAA00",
        sexo: "Masculino",
        estado_civil: "Soltero/a",
        adscripcion_id: 1, // Oficinas
        fecha_ingreso: new Date().toISOString().split('T')[0],
        calle: "Test",
        numero_exterior: "1",
        colonia: "Test",
        municipio: "Aguascalientes",
        estatus: estatus
    }

    const { error } = await supabase.from('trabajadores').insert([worker])
    if (error) {
        console.log(`Failed for '${estatus}'`)
    } else {
        console.log(`SUCCESS for '${estatus}'!`)
        await supabase.from('trabajadores').delete().eq('curp', 'TEST000000AAAAAA00')
    }
}

async function run() {
    await tryInsert('jubilado')
    await tryInsert('inactivo')
    await tryInsert('baja')
}
run()
