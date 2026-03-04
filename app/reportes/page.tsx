import React from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, Download, BarChart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ReportesPage() {
    return (
        <AppLayout title="Reportes" subtitle="Generación de Informes">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Padrón General", description: "Listado completo de trabajadores activos y jubilados.", icon: FileText },
                    { title: "Estatal por Municipio", description: "Distribución geográfica de la fuerza laboral.", icon: BarChart },
                    { title: "Hijos menores de 12", description: "Informe para entrega de apoyos escolares.", icon: Download },
                ].map((report, i) => (
                    <Card key={i} className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4 text-zinc-900 dark:text-zinc-100 font-bold">
                                <report.icon className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-xl font-bold">{report.title}</CardTitle>
                            <CardDescription>{report.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full rounded-xl h-12 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 font-bold">Generar Reporte</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </AppLayout>
    )
}
