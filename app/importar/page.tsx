'use client'

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ExcelImport from '@/components/forms/ExcelImport'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileSpreadsheet, Info, AlertTriangle, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function ImportarPage() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const checkAdmin = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        const { data: profile } = await supabase
            .from('usuarios_sistema')
            .select('rol')
            .eq('id', user.id)
            .single()

        if (profile?.rol !== 'admin') {
            setIsAdmin(false)
            toast.error("Solo administradores pueden acceder a esta sección.")
            router.push('/dashboard')
        } else {
            setIsAdmin(true)
        }
    }, [router, supabase])

    useEffect(() => {
        checkAdmin()
    }, [checkAdmin])

    if (isAdmin === null) return (
        <div className="h-screen w-full flex items-center justify-center">
            <Loader2 className="animate-spin h-10 w-10 text-zinc-400" />
        </div>
    )

    return (
        <AppLayout title="Importar" subtitle="Carga Masiva de Trabajadores">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <ExcelImport />

                        <Card className="rounded-[2.5rem] border-none bg-indigo-50 dark:bg-indigo-950/20 shadow-sm overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                                    <Info className="h-5 w-5" /> Formato Requerido
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-indigo-800 dark:text-indigo-400 font-medium">
                                    El archivo debe ser un libro de Excel (.xlsx) y la primera fila debe contener los encabezados exactos:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {["NOMBRE", "PRIMER APELLIDO", "SEGUNDO APELLIDO", "CURP", "CLAVE DE ELECTOR", "SEXO", "ESTADO CIVIL", "TELEFONO", "FECHA DE NACIMIENTO", "CALLE", "NUM EXT", "NUM INT", "COLONIA", "MUNICIPIO", "SECCION", "AREA", "DEPENDENCIA", "TIENE HIJOS", "CANTIDAD DE HIJOS", "ESTATUS"].map(col => (
                                        <span key={col} className="bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400">
                                            {col}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black/40 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" /> Notas de Seguridad
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-xs font-medium text-muted-foreground leading-relaxed">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                    <p>Asegúrate de que los nombres de las <span className="text-foreground font-bold">Adscripciones</span> coincidan exactamente con las registradas en el sistema.</p>
                                </div>
                                <p>Las CURP duplicadas serán rechazadas por la base de datos para mantener la integridad de la información.</p>
                                <p>El campo de <span className="text-foreground font-bold">Estatus</span> no es obligatorio. Si el archivo no lo incluye, todos los trabajadores se registrarán por defecto como <strong>Activos</strong>.</p>
                                <p>Se recomienda realizar una copia de seguridad antes de importaciones masivas de gran tamaño.</p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black/40 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5 text-primary" /> Ejemplo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 font-mono text-[10px] space-y-1">
                                    <p className="text-zinc-400 underline italic">Fila 1 (Encabezados):</p>
                                    <p className="text-foreground font-bold">NOMBRE, CURP, AREA, CANTIDAD DE HIJOS...</p>
                                    <p className="border-t border-zinc-200 dark:border-zinc-800 pt-1 mt-1 text-zinc-400 underline italic">Fila 2 (Datos):</p>
                                    <p className="text-foreground">JUAN, CURP123, Oficinas Centrales, 2...</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
