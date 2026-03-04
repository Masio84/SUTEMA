'use client'

import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { FileUp, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { importFromExcel } from '@/app/actions/import'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function ExcelImport() {
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const [progress, setProgress] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>('idle')

    const [summary, setSummary] = useState<{ total: number, successful: number, skipped: number } | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.xlsx')) {
            toast.error("Por favor selecciona un archivo .xlsx válido")
            return
        }

        setFileName(file.name)
        setIsProcessing(true)
        setProgress('parsing')
        setSummary(null)

        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)

                if (data.length === 0) {
                    toast.error("El archivo está vacío")
                    setIsProcessing(false)
                    setProgress('error')
                    return
                }

                setProgress('uploading')
                const result = await importFromExcel(data)

                if (result.success) {
                    toast.success("Importación finalizada")
                    setSummary({
                        total: result.total || 0,
                        successful: result.successful || 0,
                        skipped: result.skipped || 0
                    })
                    setProgress('success')
                } else {
                    toast.error(result.error)
                    setProgress('error')
                }
            } catch (err) {
                console.error(err)
                toast.error("Error al leer el archivo")
                setProgress('error')
            } finally {
                setIsProcessing(false)
            }
        }
        reader.readAsBinaryString(file)
    }

    return (
        <Card className="rounded-[2.5rem] border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 backdrop-blur-sm overflow-hidden transition-all hover:border-primary/50">
            <CardContent className="p-12">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className={cn(
                        "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500",
                        progress === 'idle' && "bg-zinc-100 dark:bg-zinc-900 text-zinc-400",
                        progress === 'parsing' && "bg-blue-100 dark:bg-blue-900/20 text-blue-500 animate-pulse",
                        progress === 'uploading' && "bg-amber-100 dark:bg-amber-900/20 text-amber-500 animate-pulse",
                        progress === 'success' && "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500",
                        progress === 'error' && "bg-red-100 dark:bg-red-900/20 text-red-500"
                    )}>
                        {progress === 'idle' && <FileSpreadsheet className="h-10 w-10" />}
                        {(progress === 'parsing' || progress === 'uploading') && <Loader2 className="h-10 w-10 animate-spin" />}
                        {progress === 'success' && <CheckCircle2 className="h-10 w-10" />}
                        {progress === 'error' && <AlertCircle className="h-10 w-10" />}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-black tracking-tight">
                            {progress === 'idle' && "Importar desde Excel"}
                            {progress === 'parsing' && "Analizando archivo..."}
                            {progress === 'uploading' && "Importando a la base de datos..."}
                            {progress === 'success' && "¡Importación exitosa!"}
                            {progress === 'error' && "Error en la importación"}
                        </h3>
                        <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                            {progress === 'idle' && "Carga un archivo .xlsx con el formato establecido para registrar múltiples trabajadores."}
                            {progress === 'success' && `Análisis completado para ${fileName}.`}
                            {progress === 'error' && "Ocurrió un problema al procesar el archivo. Revisa el formato e intenta de nuevo."}
                        </p>
                    </div>

                    {summary && (
                        <div className="grid grid-cols-3 gap-4 w-full max-w-md pt-4">
                            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-3xl">
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Total</p>
                                <p className="text-xl font-bold">{summary.total}</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-3xl">
                                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Éxito</p>
                                <p className="text-xl font-bold text-emerald-600">{summary.successful}</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-3xl">
                                <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Omitidos</p>
                                <p className="text-xl font-bold text-amber-600">{summary.skipped}</p>
                            </div>
                        </div>
                    )}

                    <div className="relative group">
                        <input
                            type="file"
                            accept=".xlsx"
                            onChange={handleFileChange}
                            disabled={isProcessing}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <Button
                            disabled={isProcessing}
                            className="rounded-2xl h-14 px-8 font-bold gap-2 shadow-xl shadow-primary/20 transition-all group-hover:scale-105 active:scale-95"
                        >
                            {isProcessing ? "Procesando..." : "Seleccionar Archivo"}
                            {!isProcessing && <FileUp className="h-5 w-5" />}
                        </Button>
                    </div>

                    {fileName && (
                        <div className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            {fileName}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
