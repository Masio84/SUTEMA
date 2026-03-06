'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { FileUp, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Wand2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { importFromExcel } from '@/app/actions/import'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

// ─────────────────────────────────────────────
// Local autocorrect helpers (mirrors server-side)
// ─────────────────────────────────────────────

const removeAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const toTitleCase = (s: string) =>
    s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim()

const normalizeSexo = (raw: string) => {
    if (!raw) return ''
    const s = removeAccents(raw.toLowerCase().trim())
    if (/^(m|masc|masculine|hombre|h|masculino)/.test(s)) return 'Masculino'
    if (/^(f|fem|femenino|feme|mujer|w|woman)/.test(s)) return 'Femenino'
    return 'Otro'
}

const normalizeEstadoCivil = (raw: string) => {
    if (!raw) return ''
    const s = removeAccents(raw.toLowerCase().trim())
    if (/^(sol|solt|solter|soltero|soltera)/.test(s)) return 'Soltero/a'
    if (/^(cas|casad|casado|casada)/.test(s)) return 'Casado/a'
    if (/^(div|divorc|divorciad|divorciado|divorciada)/.test(s)) return 'Divorciado/a'
    if (/^(viu|viud|viudo|viuda)/.test(s)) return 'Viudo/a'
    if (/^(uni|union libre|unio|uli|u\.l\.|ul)/.test(s)) return 'Unión Libre'
    return raw
}

const normalizeEstatus = (raw: string) => {
    if (!raw) return 'Activo'
    const s = removeAccents(raw.toLowerCase().trim())
    if (/jubil/.test(s)) return 'Jubilado'
    if (/baja/.test(s)) return 'Baja'
    if (/inact/.test(s)) return 'Inactivo'
    return 'Activo'
}

// Possible column header names per field (Excel may use various names)
const get = (row: any, ...keys: string[]): string => {
    for (const key of keys) {
        const found = Object.keys(row).find(
            k => k.toUpperCase().replace(/\s/g, '_') === key.toUpperCase().replace(/\s/g, '_')
        )
        if (found !== undefined && row[found] !== null && row[found] !== undefined) {
            return String(row[found])
        }
    }
    return ''
}

// Apply client-side autocorrect to a raw row for preview purposes
const applyAutocorrect = (row: any): any => ({
    ...row,
    _nombre: toTitleCase(get(row, 'NOMBRE')),
    _apellido_paterno: toTitleCase(get(row, 'PRIMER APELLIDO', 'APELLIDO PATERNO')),
    _apellido_materno: toTitleCase(get(row, 'SEGUNDO APELLIDO', 'APELLIDO MATERNO')),
    _curp: get(row, 'CURP').toUpperCase(),
    _clave_elector: get(row, 'CLAVE DE ELECTOR', 'CLAVE_DE_ELECTOR').toUpperCase(),
    _sexo: normalizeSexo(get(row, 'SEXO')),
    _estado_civil: normalizeEstadoCivil(get(row, 'ESTADO CIVIL', 'ESTADO_CIVIL')),
    _telefono: get(row, 'TELEFONO'),
    _fecha_nacimiento: get(row, 'FECHA DE NACIMIENTO', 'FECHA_DE_NACIMIENTO'),
    _calle: toTitleCase(get(row, 'CALLE')),
    _num_ext: get(row, 'NUM EXT', 'NUM_EXT', 'NUMERO EXTERIOR'),
    _num_int: get(row, 'NUM INT', 'NUM_INT', 'NUMERO INTERIOR'),
    _colonia: toTitleCase(get(row, 'COLONIA')),
    _municipio: toTitleCase(get(row, 'MUNICIPIO') || 'Aguascalientes'),
    _seccion: get(row, 'SECCION'),
    _area: get(row, 'AREA', 'DEPENDENCIA'),
    _tiene_hijos: get(row, 'TIENE HIJOS', 'TIENE_HIJOS'),
    _cantidad_hijos: get(row, 'CANTIDAD DE HIJOS', 'CANTIDAD_DE_HIJOS'),
    _estatus: normalizeEstatus(get(row, 'ESTATUS')),
})

// ─────────────────────────────────────────────
// Preview column definitions
// ─────────────────────────────────────────────

const PREVIEW_COLS: { label: string; field: string; minWidth?: number }[] = [
    { label: 'Nombre', field: '_nombre', minWidth: 120 },
    { label: 'A. Paterno', field: '_apellido_paterno', minWidth: 120 },
    { label: 'A. Materno', field: '_apellido_materno', minWidth: 120 },
    { label: 'CURP', field: '_curp', minWidth: 170 },
    { label: 'Clave Elector', field: '_clave_elector', minWidth: 160 },
    { label: 'Sexo', field: '_sexo', minWidth: 100 },
    { label: 'Est. Civil', field: '_estado_civil', minWidth: 110 },
    { label: 'Teléfono', field: '_telefono', minWidth: 120 },
    { label: 'F. Nacimiento', field: '_fecha_nacimiento', minWidth: 120 },
    { label: 'Calle', field: '_calle', minWidth: 140 },
    { label: 'Núm Ext', field: '_num_ext', minWidth: 80 },
    { label: 'Núm Int', field: '_num_int', minWidth: 80 },
    { label: 'Colonia', field: '_colonia', minWidth: 130 },
    { label: 'Municipio', field: '_municipio', minWidth: 130 },
    { label: 'Sección', field: '_seccion', minWidth: 80 },
    { label: 'Área / Adscripción', field: '_area', minWidth: 200 },
    { label: 'Tiene Hijos', field: '_tiene_hijos', minWidth: 90 },
    { label: 'Cant. Hijos', field: '_cantidad_hijos', minWidth: 90 },
    { label: 'Estatus', field: '_estatus', minWidth: 100 },
]

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function ExcelImport() {
    const [rawData, setRawData] = useState<any[] | null>(null)
    const [previewData, setPreviewData] = useState<any[] | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const [progress, setProgress] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>('idle')
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [summary, setSummary] = useState<{ total: number, successful: number, duplicates: number, validationSkipped: number } | null>(null)
    const [invalidDetails, setInvalidDetails] = useState<{ fila: number; nombre: string; curp: string; motivo: string }[]>([])
    const [showInvalidDetail, setShowInvalidDetail] = useState(false)

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
                const rawRows = XLSX.utils.sheet_to_json(ws)

                if (rawRows.length === 0) {
                    toast.error("El archivo está vacío")
                    setIsProcessing(false)
                    setProgress('error')
                    return
                }

                // Clean dates and primitives for serialisation
                const cleanRows = rawRows.map((row: any) => {
                    const cleaned: Record<string, string | number | boolean | null> = {}
                    Object.keys(row).forEach(key => {
                        const val = row[key]
                        if (val instanceof Date) {
                            cleaned[key] = val.toISOString().split('T')[0]
                        } else if (typeof val === 'string') {
                            cleaned[key] = val.trim()
                        } else if (typeof val === 'number' || typeof val === 'boolean') {
                            cleaned[key] = val
                        } else {
                            cleaned[key] = val == null ? null : String(val)
                        }
                    })
                    return cleaned
                })

                const sanitized = JSON.parse(JSON.stringify(cleanRows))
                const corrected = sanitized.map(applyAutocorrect)

                setRawData(sanitized)
                setPreviewData(corrected)
                setProgress('idle')
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

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
    const onDragLeave = () => setIsDragging(false)
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
    }

    const handleConfirmImport = async () => {
        if (!rawData) return
        setIsProcessing(true)
        setProgress('uploading')
        try {
            const result = await importFromExcel(rawData)
            if (result.success) {
                toast.success("Importación finalizada")
                setSummary({
                    total: result.total || 0,
                    successful: result.successful || 0,
                    duplicates: result.duplicates || 0,
                    validationSkipped: result.validationSkipped || 0
                })
                setInvalidDetails(result.invalidDetails || [])
                setShowInvalidDetail(false)
                setProgress('success')
                setPreviewData(null)
                setRawData(null)
            } else {
                toast.error(result.error)
                setProgress('error')
            }
        } catch {
            toast.error("Error inesperado en la importación")
            setProgress('error')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDiscard = () => {
        setPreviewData(null)
        setRawData(null)
        setFileName(null)
        setProgress('idle')
        setSummary(null)
        setInvalidDetails([])
        setShowInvalidDetail(false)
    }

    const updateCell = (index: number, field: string, value: string) => {
        if (!previewData) return
        const updated = [...previewData]
        updated[index] = { ...updated[index], [field]: value }
        setPreviewData(updated)
    }

    // ── Preview table ──────────────────────────────────────────────
    if (previewData) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header bar */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h3 className="text-xl font-black flex items-center gap-2">
                            <FileSpreadsheet className="h-6 w-6 text-primary" />
                            Vista Previa de Datos
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                <Wand2 className="h-3 w-3" /> Autocorregido
                            </span>
                        </h3>
                        <p className="text-sm font-medium text-muted-foreground mt-1">
                            Revisa y corrige los datos antes de importarlos. Se encontraron{' '}
                            <strong className="text-foreground">{previewData.length}</strong> registros.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleDiscard} disabled={isProcessing} className="rounded-xl h-12 px-6 font-bold">
                            Descartar
                        </Button>
                        <Button onClick={handleConfirmImport} disabled={isProcessing} className="rounded-xl h-12 px-6 font-bold gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                            {isProcessing ? "Importando..." : "Cargar Registros"}
                        </Button>
                    </div>
                </div>

                {/* Full preview table */}
                <Card className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                <TableRow className="hover:bg-transparent border-zinc-200 dark:border-zinc-800">
                                    <TableHead className="font-black uppercase tracking-widest text-[10px] whitespace-nowrap px-4 py-4 sticky left-0 bg-zinc-50 dark:bg-zinc-900/80 z-10">#</TableHead>
                                    {PREVIEW_COLS.map(col => (
                                        <TableHead
                                            key={col.field}
                                            className="font-black uppercase tracking-widest text-[10px] whitespace-nowrap py-4 px-3"
                                            style={{ minWidth: col.minWidth }}
                                        >
                                            {col.label}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewData.slice(0, 100).map((row, idx) => (
                                    <TableRow key={idx} className="group border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                                        <TableCell className="font-mono text-xs text-muted-foreground px-4 py-2 sticky left-0 bg-white dark:bg-zinc-950 z-10">
                                            {idx + 1}
                                        </TableCell>
                                        {PREVIEW_COLS.map(col => (
                                            <TableCell key={col.field} className="py-1 px-2">
                                                <Input
                                                    value={row[col.field] ?? ''}
                                                    onChange={(e) => updateCell(idx, col.field, e.target.value)}
                                                    className="h-7 text-xs font-medium bg-transparent border-transparent hover:border-border focus:border-primary px-2"
                                                    style={{ minWidth: col.minWidth }}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {previewData.length > 100 && (
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 text-center border-t border-zinc-200 dark:border-zinc-800">
                            <span className="text-xs font-bold text-muted-foreground">
                                Mostrando los primeros 100 registros de {previewData.length}
                            </span>
                        </div>
                    )}
                </Card>
            </div>
        )
    }

    // ── Upload zone ────────────────────────────────────────────────
    return (
        <Card
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
                "rounded-[2.5rem] border-dashed border-2 transition-all backdrop-blur-sm overflow-hidden",
                isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20",
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
                        <div className="w-full space-y-4 pt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                            {/* Invalid detail accordion */}
                            {invalidDetails.length > 0 && (
                                <div className="w-full rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
                                    <button
                                        onClick={() => setShowInvalidDetail(v => !v)}
                                        className="w-full flex items-center justify-between px-5 py-4 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                            <span className="font-black text-sm text-red-700 dark:text-red-400">
                                                {invalidDetails.length} registro{invalidDetails.length !== 1 ? 's' : ''} rechazado{invalidDetails.length !== 1 ? 's' : ''} — ver motivos
                                            </span>
                                        </div>
                                        {showInvalidDetail
                                            ? <ChevronUp className="h-4 w-4 text-red-500 shrink-0" />
                                            : <ChevronDown className="h-4 w-4 text-red-500 shrink-0" />}
                                    </button>
                                    {showInvalidDetail && (
                                        <div className="overflow-x-auto max-h-72 overflow-y-auto">
                                            <Table className="table-fixed w-full">
                                                <TableHeader className="bg-red-50/80 dark:bg-red-950/10 sticky top-0">
                                                    <TableRow className="border-red-100 dark:border-red-900/30 hover:bg-transparent">
                                                        <TableHead className="font-black uppercase text-[10px] tracking-widest w-12 py-3 px-4 whitespace-nowrap">Fila</TableHead>
                                                        <TableHead className="font-black uppercase text-[10px] tracking-widest w-36 py-3 px-4 whitespace-nowrap">Nombre</TableHead>
                                                        <TableHead className="font-black uppercase text-[10px] tracking-widest w-40 py-3 px-4 whitespace-nowrap">CURP</TableHead>
                                                        <TableHead className="font-black uppercase text-[10px] tracking-widest py-3 px-4 whitespace-nowrap">Motivo del Rechazo</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {invalidDetails.map((d) => (
                                                        <TableRow key={d.fila} className="border-red-100/50 dark:border-red-900/20 hover:bg-red-50/30 dark:hover:bg-red-950/10 align-top">
                                                            <TableCell className="font-mono text-xs font-bold text-red-400 px-4 py-3 whitespace-nowrap">{d.fila}</TableCell>
                                                            <TableCell className="text-xs font-semibold px-4 py-3 break-words">{d.nombre}</TableCell>
                                                            <TableCell className="font-mono text-xs px-4 py-3 text-muted-foreground break-all">{d.curp}</TableCell>
                                                            <TableCell className="text-xs px-4 py-3">
                                                                <span className="inline-flex items-start gap-1.5 font-bold text-red-600 dark:text-red-400 break-words">
                                                                    <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                                                                    <span>{d.motivo}</span>
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            )}
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
