'use client'

import React, { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import WorkerTable, { Worker } from '@/components/tables/WorkerTable'
import { getWorkers, deleteWorker, getAdscripciones } from '../actions/workers'
import { Input } from '@/components/ui/input'
import { Search, Filter, Plus, Download, FileSpreadsheet, FileText, Printer, SlidersHorizontal, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import WorkerDetailPanel from '@/components/workers/WorkerDetailPanel'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { exportToExcel, exportToPDF, printTable } from '@/lib/export-utils'

export const PER_PAGE = 20

export default function ConsultasPage() {
    const [workers, setWorkers] = useState<Worker[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [adscripciones, setAdscripciones] = useState<any[]>([])
    const [showFilters, setShowFilters] = useState(false)
    const router = useRouter()

    // Filter States
    const [search, setSearch] = useState('')
    const [selectedAdscripcion, setSelectedAdscripcion] = useState('all')
    const [selectedEstatus, setSelectedEstatus] = useState('all')
    const [hasHijos, setHasHijos] = useState(false)
    const [minSeniority, setMinSeniority] = useState<string>('')
    const [maxSeniority, setMaxSeniority] = useState<string>('')
    const [page, setPage] = useState(1)
    const [sortCol, setSortCol] = useState('nombre')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)

    const fetchContent = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await getWorkers({
                search,
                adscripcion: selectedAdscripcion,
                estatus: selectedEstatus,
                hijos_menores_12: hasHijos,
                seniority_min: minSeniority ? parseInt(minSeniority) : undefined,
                seniority_max: maxSeniority ? parseInt(maxSeniority) : undefined,
                page,
                perPage: PER_PAGE,
                sortCol,
                sortOrder
            })
            setWorkers(result.data as Worker[])
            setTotalCount(result.count)
        } catch (e) {
            toast.error("Error al cargar datos")
        } finally {
            setIsLoading(false)
        }
    }, [search, selectedAdscripcion, selectedEstatus, hasHijos, minSeniority, maxSeniority, page, sortCol, sortOrder])

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

    const handleDelete = async (id: string) => {
        if (confirm('¿Está seguro de eliminar este registro?')) {
            const result = await deleteWorker(id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Trabajador eliminado")
                fetchContent()
            }
        }
    }

    const handleExportExcel = () => {
        const exportData = workers.map(w => ({
            Nombre: w.nombre,
            'Apellido Paterno': w.apellido_paterno,
            'Apellido Materno': w.apellido_materno,
            CURP: w.curp,
            'Adscripción': w.adscripciones?.nombre || w.adscripcion_id,
            Estatus: w.estatus,
            'Fecha Ingreso': w.fecha_ingreso
        }))
        exportToExcel(exportData, 'Trabajadores_SUTEMA')
        toast.success("Exportando a Excel...")
    }

    const handleExportPDF = () => {
        const exportData = workers.map(w => ({
            Nombre: `${w.nombre} ${w.apellido_paterno}`,
            CURP: w.curp,
            Adscripcion: w.adscripciones?.nombre || w.adscripcion_id,
            Estatus: w.estatus,
            Antiguedad: `${calculateSeniority(w.fecha_ingreso)} años`
        }))
        exportToPDF(exportData, ['Nombre', 'CURP', 'Adscripcion', 'Estatus', 'Antiguedad'], 'Padrón_SUTEMA')
        toast.success("Generando PDF...")
    }

    const calculateSeniority = (date: string) => {
        const start = new Date(date)
        const now = new Date()
        let years = now.getFullYear() - start.getFullYear()
        if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) {
            years--
        }
        return years
    }

    const clearFilters = () => {
        setSearch('')
        setSelectedAdscripcion('all')
        setSelectedEstatus('all')
        setHasHijos(false)
        setMinSeniority('')
        setMaxSeniority('')
        setPage(1)
        setSortCol('nombre')
        setSortOrder('asc')
    }

    const totalPages = Math.ceil(totalCount / PER_PAGE)

    return (
        <AppLayout title="Consultas" subtitle="Gestión Avanzada de Trabajadores">
            <div className="space-y-6">
                {/* Top bar */}
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between glass-card p-6">
                    <div className="relative w-full lg:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-900/60 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar trabajador por nombre, CURP, teléfono..."
                            className="pl-11 h-12 rounded-2xl border-border bg-background focus:ring-primary/20 focus:border-primary/40 placeholder:text-muted-foreground text-foreground font-medium"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
                        <Button
                            variant={showFilters ? "secondary" : "outline"}
                            className="rounded-2xl h-12 gap-2 border-border px-5"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal className="h-4 w-4" /> Filtros {showFilters ? 'activos' : ''}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="rounded-2xl h-12 gap-2 border-border px-5">
                                    <Download className="h-4 w-4" /> Exportar
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-border p-2">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-primary-900/60 dark:text-primary-200/60">Formatos disponibles</DropdownMenuLabel>
                                <DropdownMenuItem onClick={handleExportExcel} className="rounded-xl gap-2 font-bold py-3"><FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Excel (.xlsx)</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportPDF} className="rounded-xl gap-2 font-bold py-3"><FileText className="h-4 w-4 text-red-500" /> Documento PDF</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => printTable('workers-print-area')} className="rounded-xl gap-2 font-bold py-3"><Printer className="h-4 w-4" /> Imprimir Tabla</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button className="rounded-2xl h-12 bg-primary dark:bg-primary dark:text-primary-foreground gap-2 px-6 font-bold" onClick={() => router.push('/registro')}>
                            <Plus className="h-4 w-4" /> Nuevo
                        </Button>
                    </div>
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="glass-card p-8 space-y-8 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary-900/60 dark:text-primary-200/60 ml-1">Adscripción</Label>
                                        <Select value={selectedAdscripcion} onValueChange={(v) => { setSelectedAdscripcion(v); setPage(1) }}>
                                            <SelectTrigger className="h-12 rounded-xl border-border">
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="all">Todas las áreas</SelectItem>
                                                {adscripciones.map(a => (
                                                    <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary-900/60 dark:text-primary-200/60 ml-1">Estatus Laboral</Label>
                                        <Select value={selectedEstatus} onValueChange={(v) => { setSelectedEstatus(v); setPage(1) }}>
                                            <SelectTrigger className="h-12 rounded-xl border-border">
                                                <SelectValue placeholder="Cualquiera" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="all">Cualquier Estatus</SelectItem>
                                                <SelectItem value="activo">Activo</SelectItem>
                                                <SelectItem value="jubilado">Jubilado</SelectItem>
                                                <SelectItem value="inactivo">Inactivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary-900/60 dark:text-primary-200/60 ml-1">Antigüedad (Años)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Min"
                                                className="h-12 rounded-xl text-center border-border"
                                                value={minSeniority}
                                                onChange={(e) => { setMinSeniority(e.target.value); setPage(1) }}
                                            />
                                            <span className="text-primary-900/30 dark:text-primary-200/30">—</span>
                                            <Input
                                                type="number"
                                                placeholder="Max"
                                                className="h-12 rounded-xl text-center border-border"
                                                value={maxSeniority}
                                                onChange={(e) => { setMaxSeniority(e.target.value); setPage(1) }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-end pb-2">
                                        <div className="flex items-center space-x-3 bg-background border border-border p-4 rounded-xl">
                                            <Checkbox
                                                id="hijos"
                                                checked={hasHijos}
                                                onCheckedChange={(v) => { setHasHijos(!!v); setPage(1) }}
                                                className="h-5 w-5 rounded-md"
                                            />
                                            <Label htmlFor="hijos" className="font-bold cursor-pointer text-sm">Hijos menores de 12</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex border-t border-border pt-6 justify-between items-center">
                                    <p className="text-xs font-bold text-zinc-400">{totalCount} registros encontrados</p>
                                    <Button
                                        variant="ghost"
                                        onClick={clearFilters}
                                        className="text-xs uppercase font-black tracking-widest gap-2 text-zinc-500 hover:text-black dark:hover:text-white"
                                    >
                                        <X className="h-4 w-4" /> Limpiar Filtros
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results Area */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-80 bg-card/50 backdrop-blur-sm rounded-[3rem] border border-border">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            className="w-12 h-12 border-4 border-muted border-t-primary rounded-full mb-4"
                        />
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Actualizando datos...</p>
                    </div>
                ) : (
                    <WorkerTable
                        workers={workers}
                        onDelete={handleDelete}
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(p) => setPage(p)}
                        sortCol={sortCol}
                        sortOrder={sortOrder}
                        searchTerm={search}
                        onRowClick={(w) => setSelectedWorkerId(w.id)}
                        onSort={(col) => {
                            if (sortCol === col) {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                                setSortCol(col)
                                setSortOrder('asc')
                            }
                        }}
                    />
                )}
            </div>

            {/* Worker detail / edit panel */}
            <WorkerDetailPanel
                workerId={selectedWorkerId}
                onClose={() => setSelectedWorkerId(null)}
                onSaved={() => { setSelectedWorkerId(null); fetchContent() }}
            />
        </AppLayout>
    )
}
