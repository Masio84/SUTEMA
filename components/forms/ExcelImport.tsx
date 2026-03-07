'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { FileUp, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Wand2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { importFromExcel, getAdscripcionesList } from '@/app/actions/import'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
    getOfficialAdscripcionName,
    removeAccents,
    toTitleCase,
    normalizeSexo,
    normalizeEstadoCivil,
    normalizeEstatus
} from '@/lib/utils/normalization'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'

// ─────────────────────────────────────────────
// Local autocorrect helpers (mirrors server-side)
// ─────────────────────────────────────────────

// Redundant local helpers removed in favor of @/lib/utils/normalization

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

    const [unmappedAreas, setUnmappedAreas] = useState<string[]>([])
    const [areaMappings, setAreaMappings] = useState<Record<string, string>>({})
    const [availableAdscripciones, setAvailableAdscripciones] = useState<{ id: string, nombre: string }[]>([])
    const [isMappingMode, setIsMappingMode] = useState(false)

    const PARENT_CATEGORIES = [
        "Oficinas Centrales",
        "Distrito Sanitario 1",
        "Distrito Sanitario 2",
        "Distrito Sanitario 3",
        "Regulación Sanitaria",
        "Agua Clara",
        "CERESO",
        "SEEM"
    ]

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

                // Fetch adscripciones to check against
                const adscs = await getAdscripcionesList()
                setAvailableAdscripciones(adscs)

                // Identity unknown areas
                const uniqueAreas = Array.from(new Set(sanitized.map((r: any) => get(r, 'AREA', 'DEPENDENCIA')))).filter(Boolean) as string[]
                const knownNames = new Set(adscs.map(a => a.nombre.toLowerCase().trim()))

                // We also consider things matched by the fuzzy matcher as "known" if they exist in DB
                // For simplicity, let's just find what is NOT in the official list and NOT matched by fuzzy logic
                const unknown = uniqueAreas.filter(area => {
                    const norm = area.toLowerCase().trim()
                    if (knownNames.has(norm)) return false

                    // Check if fuzzy matcher can identify it
                    const identified = getOfficialAdscripcionName(area)
                    if (identified && knownNames.has(identified.toLowerCase().trim())) return false

                    return true
                })

                setUnmappedAreas(unknown)

                const corrected = sanitized.map(applyAutocorrect)
                setRawData(sanitized)
                setPreviewData(corrected)

                if (unknown.length > 0) {
                    setIsMappingMode(true)
                }

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
            const result = await importFromExcel(rawData, areaMappings)
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

    // ── Mapping View ──────────────────────────────────────────────
    if (isMappingMode && unmappedAreas.length > 0) {
        // Collect records that need mapping
        const recordsNeedingMapping = (rawData || []).map((row, idx) => ({
            index: idx,
            nombre: `${get(row, 'NOMBRE')} ${get(row, 'PRIMER APELLIDO', 'APELLIDO PATERNO')} ${get(row, 'SEGUNDO APELLIDO', 'APELLIDO MATERNO')}`,
            rawArea: get(row, 'AREA', 'DEPENDENCIA')
        })).filter(r => unmappedAreas.includes(r.rawArea))

        const mappedRecordCount = recordsNeedingMapping.filter(r => areaMappings[r.index]).length
        const allRecordsMapped = mappedRecordCount === recordsNeedingMapping.length

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <AlertCircle className="h-24 w-24 text-amber-500" />
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 italic">
                                ¡Atención! Se requiere Mapeo de Áreas
                            </h3>
                            <p className="text-amber-800/80 dark:text-amber-400/60 font-medium text-sm mt-1 max-w-2xl">
                                Hemos detectado <span className="font-bold underline text-amber-600 dark:text-amber-400">{unmappedAreas.length}</span> áreas únicas con inconsistencias.
                                Por favor, asocia cada registro a la categoría correspondiente.
                                <span className="block mt-1 text-xs opacity-70 italic">Nota: Registros marcados como "ISSEA" se deben asignar individualmente.</span>
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="rounded-[2.5rem] border-border shadow-xl overflow-hidden bg-card/50 backdrop-blur-xl">
                    <div className="max-h-[450px] overflow-auto">
                        <Table className="table-fixed w-full">
                            <TableHeader className="bg-muted/50 sticky top-0 z-20">
                                <TableRow className="border-b border-border">
                                    <TableHead className="w-12 px-3 py-2.5 font-black uppercase tracking-widest text-[9px] text-muted-foreground">#</TableHead>
                                    <TableHead className="w-[35%] font-black uppercase tracking-widest text-[9px] px-3">Nombre Completo</TableHead>
                                    <TableHead className="w-[30%] font-black uppercase tracking-widest text-[9px] px-3">Adscripción en Excel</TableHead>
                                    <TableHead className="w-[180px] font-black uppercase tracking-widest text-[9px] px-3 text-primary">Categoría Oficial</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recordsNeedingMapping.map((r, i) => (
                                    <TableRow key={r.index} className="group hover:bg-primary/5 transition-colors border-border">
                                        <TableCell className="px-3 py-1.5 font-mono text-[9px] text-muted-foreground font-bold">{i + 1}</TableCell>
                                        <TableCell className="px-3 py-1.5 font-bold text-xs text-foreground uppercase truncate" title={r.nombre}>{r.nombre}</TableCell>
                                        <TableCell className="px-3 py-1.5 truncate">
                                            <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border text-[10px] px-2 py-0 font-medium truncate max-w-full" title={r.rawArea}>
                                                {r.rawArea}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-3 py-1.5">
                                            <Select
                                                value={areaMappings[r.index] || ''}
                                                onValueChange={(v) => {
                                                    setAreaMappings(prev => {
                                                        const next = { ...prev, [r.index]: v }
                                                        // If it's NOT ISSEA, apply to all records sharing the same raw string
                                                        if (r.rawArea.toUpperCase().trim() !== 'ISSEA') {
                                                            recordsNeedingMapping.forEach(other => {
                                                                if (other.rawArea === r.rawArea) {
                                                                    next[other.index] = v
                                                                }
                                                            })
                                                        }
                                                        return next
                                                    })
                                                }}
                                            >
                                                <SelectTrigger className={cn(
                                                    "h-8 w-full rounded-lg font-bold transition-all border text-xs",
                                                    areaMappings[r.index]
                                                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                        : "border-border bg-background text-muted-foreground"
                                                )}>
                                                    <SelectValue placeholder="Asignar..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl p-1 shadow-2xl border-primary/20">
                                                    {PARENT_CATEGORIES.map(cat => (
                                                        <SelectItem key={cat} value={cat} className="rounded-lg font-bold text-xs py-2 px-3 cursor-pointer">
                                                            {cat}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-muted/30 p-6 rounded-[2.5rem] border border-border">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-lg">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-black text-foreground">
                            {mappedRecordCount} de {recordsNeedingMapping.length} registros mapeados
                        </p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button variant="outline" onClick={handleDiscard} className="flex-1 md:flex-none rounded-xl h-12 px-8 font-bold border-2 hover:bg-muted/50">
                            Cancelar
                        </Button>
                        <Button
                            disabled={!allRecordsMapped}
                            onClick={() => {
                                if (previewData) {
                                    const updated = [...previewData]
                                    recordsNeedingMapping.forEach(r => {
                                        if (areaMappings[r.index]) {
                                            updated[r.index] = { ...updated[r.index], _area: areaMappings[r.index] }
                                        }
                                    })
                                    setPreviewData(updated)
                                }
                                setIsMappingMode(false)
                            }}
                            className="flex-1 md:flex-none rounded-xl h-12 px-12 font-black gap-2 shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-wider"
                        >
                            Continuar a Validación
                        </Button>
                    </div>
                </div>
            </div>
        )
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
                                    <TableRow key={idx} className="group border-border/50 hover:bg-muted/30">
                                        <TableCell className="font-mono text-[9px] text-muted-foreground px-3 py-1.5 sticky left-0 bg-background z-10">
                                            {idx + 1}
                                        </TableCell>
                                        {PREVIEW_COLS.map(col => (
                                            <TableCell key={col.field} className="py-0 px-1 border-l border-border/30">
                                                <Input
                                                    value={row[col.field] ?? ''}
                                                    onChange={(e) => updateCell(idx, col.field, e.target.value)}
                                                    className="h-7 text-[10px] font-medium bg-transparent border-transparent hover:bg-background/50 focus:bg-background rounded-none border-none shadow-none px-2 focus:ring-0"
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
                isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-card/30",
                progress === 'success' && "border-emerald-500/50 bg-emerald-500/5"
            )}
        >
            <CardContent className="p-12">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className={cn(
                        "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500",
                        progress === 'idle' && "bg-muted text-muted-foreground",
                        progress === 'parsing' && "bg-blue-500/10 text-blue-500 animate-pulse",
                        progress === 'uploading' && "bg-amber-500/10 text-amber-500 animate-pulse",
                        progress === 'success' && "bg-emerald-500/10 text-emerald-500",
                        progress === 'error' && "bg-red-500/10 text-red-500"
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
                                <div className="bg-muted p-4 rounded-3xl">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Total</p>
                                    <p className="text-xl font-bold">{summary.total}</p>
                                </div>
                                <div className="bg-emerald-500/5 p-4 rounded-3xl border border-emerald-500/20">
                                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Éxito</p>
                                    <p className="text-xl font-bold text-emerald-600">{summary.successful}</p>
                                </div>
                                <div className="bg-amber-500/5 p-4 rounded-3xl border border-amber-500/20">
                                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Duplicados</p>
                                    <p className="text-xl font-bold text-amber-600">{summary.duplicates}</p>
                                </div>
                                <div className="bg-red-500/5 p-4 rounded-3xl border border-red-500/20">
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
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border">
                                <FileSpreadsheet className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold text-muted-foreground">
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
