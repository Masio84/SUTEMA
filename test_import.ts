import { importFromExcel } from './app/actions/import'

async function run() {
    const rawData = [
        {
            "NOMBRE": "Testing",
            "PRIMER APELLIDO": "Test",
            "CURP": "TEST123456TESTER12",
            "AREA": "Oficinas Centrales"
        }
    ]
    console.log("simulating import")
    const res = await importFromExcel(rawData)
    console.log("result", res)
}
run()
