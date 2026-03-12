'use client'

import React, { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Download, BarChart, Loader2, Search, SlidersHorizontal, X, FileType } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getWorkers, getAdscripciones } from '@/app/actions/workers'
import { exportToPDF } from '@/lib/export-utils'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import WorkerTable, { Worker } from '@/components/tables/WorkerTable'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"

const ALL_WORKER_FIELDS = [
    { id: 'nombre', label: 'NOMBRE' },
    { id: 'apellido_paterno', label: 'APE. PATERNO' },
    { id: 'apellido_materno', label: 'APE. MATERNO' },
    { id: 'curp', label: 'CURP' },
    { id: 'telefono', label: 'TELÉFONO' },
    { id: 'sexo', label: 'SEXO' },
    { id: 'estado_civil', label: 'EDO. CIVIL' },
    { id: 'fecha_nacimiento', label: 'F. NAC.' },
    { id: 'fecha_ingreso', label: 'F. ING.' },
    { id: 'adscripcion_nombre', label: 'ADSCRIPCIÓN' },
    { id: 'hijos_12', label: 'HIJOS < 12' },
    { id: 'calle', label: 'CALLE' },
    { id: 'numero_exterior', label: 'EXT.' },
    { id: 'numero_interior', label: 'INT.' },
    { id: 'colonia', label: 'COLONIA' },
    { id: 'municipio', label: 'MUNICIPIO' },
    { id: 'seccion_ine', label: 'SEC. INE' },
    { id: 'clave_elector', label: 'CLAVE ELECTOR' },
]

export default function ReportesPage() {
    const searchParams = useSearchParams()
    
    const [workers, setWorkers] = useState<Worker[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [adscripciones, setAdscripciones] = useState<any[]>([])
    const [showFilters, setShowFilters] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedFields, setSelectedFields] = useState<string[]>(['nombre', 'apellido_paterno', 'apellido_materno', 'curp', 'adscripcion_nombre'])

    // Filter States
    const [search, setSearch] = useState('')
    const [selectedAdscripcion, setSelectedAdscripcion] = useState('all')
    const [selectedMunicipio, setSelectedMunicipio] = useState('all')
    const [selectedEstatus, setSelectedEstatus] = useState('all')
    const [selectedSexo, setSelectedSexo] = useState(searchParams.get('sexo') || 'all')
    const [hasHijos, setHasHijos] = useState(searchParams.get('tiene_hijos') === 'true' || searchParams.get('hijos_menores_12') === 'true')
    const [page, setPage] = useState(1)
    const [sortCol, setSortCol] = useState('nombre')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    const fetchContent = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await getWorkers({
                search,
                adscripcion: selectedAdscripcion,
                estatus: selectedEstatus,
                municipio: selectedMunicipio,
                sexo: selectedSexo,
                hijos_menores_12: hasHijos,
                page,
                perPage: 15, // Slightly less for reports view
                sortCol,
                sortOrder
            })
            setWorkers(result.data as Worker[])
            setTotalCount(result.count)
        } catch (e) {
            toast.error("Error al cargar datos para reportes")
        } finally {
            setIsLoading(false)
        }
    }, [search, selectedAdscripcion, selectedEstatus, selectedMunicipio, selectedSexo, hasHijos, page, sortCol, sortOrder])

    useEffect(() => {
        const timer = setTimeout(fetchContent, 300)
        return () => clearTimeout(timer)
    }, [fetchContent])

    useEffect(() => {
        async function loadResources() {
            const ads = await getAdscripciones()
            setAdscripciones(ads)
        }
        loadResources()
    }, [])

    const handleGenerateReport = async () => {
        setIsGenerating(true)
        try {
            // Fetch ALL data matching current filters (ignoring pagination)
            const result = await getWorkers({
                search,
                adscripcion: selectedAdscripcion,
                estatus: selectedEstatus,
                municipio: selectedMunicipio,
                sexo: selectedSexo,
                hijos_menores_12: hasHijos,
                perPage: 10000,
                sortCol,
                sortOrder
            })

            if (!result.data || result.data.length === 0) {
                toast.error("No hay datos que coincidan con los filtros actuales")
                return
            }

            // Flatten and map data for export
            const mappedData = result.data.map((w: any) => ({
                ...w,
                adscripcion_nombre: w.adscripciones?.nombre || w.adscripcion_id,
                unidad_nombre: w.unidades?.nombre || w.unidad_id,
                hijos_12: w.hijos_menores_12 ? w.hijos_menores_12.toString() : '0',
                fecha_nacimiento: w.fecha_nacimiento ? new Date(w.fecha_nacimiento).toLocaleDateString() : '',
                fecha_ingreso: w.fecha_ingreso ? new Date(w.fecha_ingreso).toLocaleDateString() : '',
            }))

            const title = "Reporte Personalizado de Trabajadores"
            const fileName = `reporte_sutema_${new Date().getTime()}`

            // Pass label definitions to maintain formatting in PDF
            const colDefs = ALL_WORKER_FIELDS.filter(f => selectedFields.includes(f.id))

            await exportToPDF(mappedData, colDefs, fileName, title)
            toast.success("Reporte PDF generado exitosamente")
            setIsDialogOpen(false)
        } catch (error) {
            console.error(error)
            toast.error("Error al generar el reporte")
        } finally {
            setIsGenerating(false)
        }
    }

    const clearFilters = () => {
        setSearch('')
        setSelectedAdscripcion('all')
        setSelectedMunicipio('all')
        setSelectedEstatus('all')
        setSelectedSexo('all')
        setHasHijos(false)
        setPage(1)
    }

    const toggleField = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(id => id !== fieldId)
                : [...prev, fieldId]
        )
    }

    const handleSelectAll = () => {
        if (selectedFields.length === ALL_WORKER_FIELDS.length) {
            setSelectedFields([])
        } else {
            setSelectedFields(ALL_WORKER_FIELDS.map(f => f.id))
        }
    }

    const totalPages = Math.ceil(totalCount / 15)

    return (
        <AppLayout title="Reportes" subtitle="Generación de Informes Personalizados">
            <div className="space-y-6">
                {/* Header & Main Actions */}
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between glass-card p-6">
                    <div className="flex items-center gap-4 w-full lg:max-w-md">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                            <Input
                                placeholder="Filtrar por nombre, CURP..."
                                className="pl-11 h-12 rounded-2xl border-zinc-200 bg-white"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            />
                        </div>
                        <Button
                            variant={showFilters ? "secondary" : "outline"}
                            className="rounded-2xl h-12 w-12 p-0 border-zinc-200 shrink-0"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        disabled={totalCount === 0 || isGenerating}
                        className="rounded-2xl h-12 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 px-8 font-bold gap-2 w-full lg:w-auto ring-offset-background transition-all hover:scale-[1.02]"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <FileType className="h-4 w-4" />
                        )}
                        Generar Reporte PDF ({totalCount})
                    </Button>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <Card className="rounded-[2.5rem] border-zinc-200 shadow-sm mb-6">
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Adscripción</Label>
                                            <Select value={selectedAdscripcion} onValueChange={(v) => { setSelectedAdscripcion(v); setPage(1) }}>
                                                <SelectTrigger className="h-12 rounded-xl border-zinc-200">
                                                    <SelectValue placeholder="Todas" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="all">Todas</SelectItem>
                                                    {adscripciones.map(a => (
                                                        <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Municipio</Label>
                                            <Select value={selectedMunicipio} onValueChange={(v) => { setSelectedMunicipio(v); setPage(1) }}>
                                                <SelectTrigger className="h-12 rounded-xl border-zinc-200">
                                                    <SelectValue placeholder="Todos" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="AGUASCALIENTES">Aguascalientes</SelectItem>
                                                    <SelectItem value="ASIENTOS">Asientos</SelectItem>
                                                    <SelectItem value="CALVILLO">Calvillo</SelectItem>
                                                    <SelectItem value="COSIO">Cosío</SelectItem>
                                                    <SelectItem value="JESUS MARIA">Jesús María</SelectItem>
                                                    <SelectItem value="PABELLON DE ARTEAGA">Pabellón de Arteaga</SelectItem>
                                                    <SelectItem value="RINCON DE ROMOS">Rincón de Romos</SelectItem>
                                                    <SelectItem value="SAN JOSE DE GRACIA">San José de Gracia</SelectItem>
                                                    <SelectItem value="TEPEZALA">Tepezalá</SelectItem>
                                                    <SelectItem value="EL LLANO">El Llano</SelectItem>
                                                    <SelectItem value="SAN FRANCISCO DE LOS ROMO">San Francisco de los Romo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Estatus</Label>
                                            <Select value={selectedEstatus} onValueChange={(v) => { setSelectedEstatus(v); setPage(1) }}>
                                                <SelectTrigger className="h-12 rounded-xl border-zinc-200">
                                                    <SelectValue placeholder="Cualquiera" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="all">Cualquiera</SelectItem>
                                                    <SelectItem value="activo">Activo</SelectItem>
                                                    <SelectItem value="jubilado">Jubilado</SelectItem>
                                                    <SelectItem value="inactivo">Inactivo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Género</Label>
                                            <Select value={selectedSexo} onValueChange={(v) => { setSelectedSexo(v); setPage(1) }}>
                                                <SelectTrigger className="h-12 rounded-xl border-zinc-200">
                                                    <SelectValue placeholder="Todos" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="Masculino">Masculino</SelectItem>
                                                    <SelectItem value="Femenino">Femenino</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex flex-col justify-end gap-2 px-2">
                                            <div className="flex items-center space-x-3 mb-1">
                                                <Checkbox
                                                    id="hijos"
                                                    checked={hasHijos}
                                                    onCheckedChange={(v) => { setHasHijos(!!v); setPage(1) }}
                                                    className="h-5 w-5 rounded-md"
                                                />
                                                <Label htmlFor="hijos" className="font-bold cursor-pointer text-sm">Hijos menores de 12</Label>
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-end">
                                            <Button
                                                variant="ghost"
                                                onClick={clearFilters}
                                                className="h-12 rounded-xl px-4 text-zinc-500 hover:text-zinc-900 gap-2 font-bold text-xs uppercase tracking-widest"
                                            >
                                                <X className="h-4 w-4" /> Limpiar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Preview Table */}
                <div className="relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-[3rem]">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
                        </div>
                    )}
                    <WorkerTable
                        workers={workers}
                        onDelete={() => { }} // No delete in reports view
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(p) => setPage(p)}
                        sortCol={sortCol}
                        sortOrder={sortOrder}
                        searchTerm={search}
                        onSort={(col) => {
                            if (sortCol === col) {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                                setSortCol(col)
                                setSortOrder('asc')
                            }
                        }}
                    />
                </div>
            </div>

            {/* Field Selection Modal */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
                    <div className="bg-zinc-900 p-8 text-white flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-3xl font-bold mb-2">Personalizar Reporte</DialogTitle>
                            <DialogDescription className="text-zinc-400 text-lg">
                                Selecciona las columnas que aparecerán en el PDF final.
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800 rounded-xl mt-1"
                            onClick={handleSelectAll}
                        >
                            {selectedFields.length === ALL_WORKER_FIELDS.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                        </Button>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 max-h-[45vh] overflow-y-auto px-1 py-1 custom-scrollbar">
                            {ALL_WORKER_FIELDS.map((field) => (
                                <div key={field.id} className="flex items-center space-x-3 group">
                                    <Checkbox
                                        id={`field-${field.id}`}
                                        checked={selectedFields.includes(field.id)}
                                        onCheckedChange={() => toggleField(field.id)}
                                        className="h-5 w-5 border-zinc-300 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900"
                                    />
                                    <Label htmlFor={`field-${field.id}`} className="text-sm font-semibold cursor-pointer group-hover:text-zinc-900 transition-colors">
                                        {field.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="bg-zinc-50 p-6 flex-col sm:flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                            className="rounded-xl h-12 px-6 font-bold text-zinc-500 hover:bg-zinc-200"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleGenerateReport}
                            disabled={selectedFields.length === 0 || isGenerating}
                            className="rounded-xl h-12 px-8 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-xs flex-1 sm:flex-none shadow-lg shadow-zinc-200"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando PDF...
                                </>
                            ) : (
                                'Descargar Reporte'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    )
}
