import React from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Settings, Lock, Database, Trash2, ShieldCheck, Paintbrush } from 'lucide-react'

export default function ConfigPage() {
    return (
        <AppLayout title="Configuración" subtitle="Preferencias del Sistema">
            <div className="max-w-4xl mx-auto space-y-8">
                <Card className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                    <CardHeader className="pt-8 px-8 flex flex-row items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Seguridad y Acceso</CardTitle>
                            <CardDescription>Gestión de usuarios y permisos del sistema.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex justify-between items-center py-4 border-b border-zinc-50 dark:border-zinc-900">
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-zinc-100">Autenticación de Dos Factores</p>
                                <p className="text-xs text-zinc-500">Añade una capa extra de seguridad a tu cuenta.</p>
                            </div>
                            <Button variant="outline" className="rounded-xl font-bold">Configurar</Button>
                        </div>
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-zinc-100">Registro de Auditoría</p>
                                <p className="text-xs text-zinc-500">Ver quién ha realizado cambios recientemente.</p>
                            </div>
                            <Button variant="outline" className="rounded-xl font-bold">Ver Logs</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                    <CardHeader className="pt-8 px-8 flex flex-row items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                            <Database className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Base de Datos</CardTitle>
                            <CardDescription>Mantenimiento y respaldos del sistema.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <Button className="rounded-xl h-12 flex-1 gap-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 font-bold border-zinc-200 dark:border-zinc-800">
                                Respaldar Padrón
                            </Button>
                            <Button variant="outline" className="rounded-xl h-12 flex-1 gap-2 font-bold border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20">
                                Limpiar Caché
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
