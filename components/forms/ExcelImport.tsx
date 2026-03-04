'use client'

import React, { useState, useRef } from 'react'
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
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [summary, setSummary] = useState<{ total: number, successful: number, duplicates: number, validationSkipped: number } | null>(null)

    const handleFile = async (file: File) => {
        if (!file) return

        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
        if (!isExcel) {
            toast.error("Por favor selecciona un archivo .xlsx o .xls válido")
            setProgress('error')
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
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const rawData = XLSX.utils.sheet_to_json(ws)

                if (rawData.length === 0) {
                    toast.error("El archivo está vacío")
                    setIsProcessing(false)
                    setProgress('error')
                    return
                }

                // Clean and sanitize data for serialization
                const cleanRows = rawData.map((row: any) => {
                    const cleanRow: Record<string, string | number | boolean | null> = {}

                    Object.keys(row).forEach(key => {
                        const val = row[key]

                        if (val instanceof Date) {
                            // Convert dates to YYYY-MM-DD
                            cleanRow[key] = val.toISOString().split('T')[0]
                        } else if (typeof val === 'string') {
                            // Normalize strings
                            let cleanVal = val.trim()
                            if (key === 'CURP') cleanVal = cleanVal.toUpperCase()
                            cleanRow[key] = cleanVal
                        } else if (typeof val === 'number' || typeof val === 'boolean') {
                            cleanRow[key] = val
                        } else if (val === null || val === undefined) {
                            cleanRow[key] = null
                        } else {
                            // Fallback for any other types
                            cleanRow[key] = String(val)
                        }
                    })
                    return cleanRow
                })

                // Final safety check: ensure strictly plain objects via JSON roundtrip
                const sanitizedRows = JSON.parse(JSON.stringify(cleanRows))
                console.log("Rows ready for import:", sanitizedRows)

                setProgress('uploading')
                const result = await importFromExcel(sanitizedRows)

                if (result.success) {
                    toast.success("Importación finalizada")
                    setSummary({
                        total: result.total || 0,
                        successful: result.successful || 0,
                        duplicates: result.duplicates || 0,
                        validationSkipped: result.validationSkipped || 0
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
        reader.onerror = () => {
            toast.error("Error al leer el archivo")
            setProgress('error')
            setIsProcessing(false)
        }
        reader.readAsBinaryString(file)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = () => {
        setIsDragging(false)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
    }

    return (
        <Card
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
                "rounded-[2.5rem] border-dashed border-2 transition-all backdrop-blur-sm overflow-hidden",
                isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20",
                progress === 'success' && "border-emerald-500/50 bg-emerald-50/50"
            )}
        >
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
                            {progress === 'idle' && (isDragging ? "¡Suelta el archivo aquí!" : "Importar desde Excel")}
                            {progress === 'parsing' && "Analizando archivo..."}
                            {progress === 'uploading' && "Importando a la base de datos..."}
                            {progress === 'success' && "¡Importación exitosa!"}
                            {progress === 'error' && "Error en la importación"}
                        </h3>
                        <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                            {progress === 'idle' && "Arrastra y suelta tu archivo .xlsx o .xls aquí, o haz clic en el botón."}
                            {progress === 'success' && "Análisis completado satisfactoriamente."}
                            {progress === 'error' && "Ocurrió un problema al procesar el archivo. Revisa el formato e intenta de nuevo."}
                        </p>
                    </div>

                    {summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full pt-4">
                            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-3xl">
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Total</p>
                                <p className="text-xl font-bold">{summary.total}</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-900/50">
                                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Éxito</p>
                                <p className="text-xl font-bold text-emerald-600">{summary.successful}</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-3xl border border-amber-100 dark:border-amber-900/50">
                                <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Duplicados</p>
                                <p className="text-xl font-bold text-amber-600">{summary.duplicates}</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-3xl border border-red-100 dark:border-red-900/50">
                                <p className="text-[10px] font-black uppercase text-red-600 tracking-wider">Inválidos</p>
                                <p className="text-xl font-bold text-red-600">{summary.validationSkipped}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="rounded-2xl h-14 px-8 font-bold gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                        >
                            {isProcessing ? "Procesando..." : "Seleccionar Archivo"}
                            {!isProcessing && <FileUp className="h-5 w-5" />}
                        </Button>

                        {fileName && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                <FileSpreadsheet className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                    Archivo seleccionado: <span className="text-foreground">{fileName}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
