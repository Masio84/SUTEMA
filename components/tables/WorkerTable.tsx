'use client'

import React, { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, MoreHorizontal, Edit, Trash, Download, FileSpreadsheet, FileText, Printer, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export interface Worker {
    id: string
    nombre: string
    apellido_paterno: string
    apellido_materno?: string
    curp: string
    adscripcion_id: string
    adscripciones?: { nombre: string }
    unidad_id?: string
    unidades?: { nombre: string }
    estatus: string
    fecha_ingreso: string
}

interface WorkerTableProps {
    workers: Worker[]
    onDelete: (id: string) => void
    onPageChange: (page: number) => void
    currentPage: number
    totalPages: number
    onSort: (col: string) => void
    sortCol: string
    sortOrder: 'asc' | 'desc'
    searchTerm?: string
}

export default function WorkerTable({ workers, onDelete, onPageChange, currentPage, totalPages, onSort, sortCol, sortOrder, searchTerm = '' }: WorkerTableProps) {
    const router = useRouter()

    const highlightText = (text: string | undefined | null) => {
        if (!text) return ''
        if (!searchTerm.trim()) return text

        const parts = text.toString().split(new RegExp(`(${searchTerm})`, 'gi'))
        return (
            <span>
                {parts.map((part, i) => (
                    part.toLowerCase() === searchTerm.toLowerCase() ? (
                        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white rounded-sm px-0.5">{part}</mark>
                    ) : (
                        part
                    )
                ))}
            </span>
        )
    }

    const getEstatusBadge = (estatus: string) => {
        switch (estatus) {
            case 'activo': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800">Activo</Badge>
            case 'inactivo': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800">Inactivo</Badge>
            case 'jubilado': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">Jubilado</Badge>
            default: return <Badge variant="secondary">{estatus.charAt(0).toUpperCase() + estatus.slice(1)}</Badge>
        }
    }

    const getSeniority = (date: string) => {
        const start = new Date(date)
        const now = new Date()
        let years = now.getFullYear() - start.getFullYear()
        if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) {
            years--
        }
        return years
    }

    const getSortIcon = (col: string) => {
        if (sortCol !== col) return <ChevronRight className="h-3 w-3 opacity-20 rotate-90" />
        return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
    }

    const Header = ({ label, col, sortable = true }: { label: string, col: string, sortable?: boolean }) => (
        <TableHead
            className={`font-black uppercase tracking-widest text-[10px] text-muted-foreground py-5 px-6 ${sortable ? 'cursor-pointer hover:text-foreground transition-colors' : ''}`}
            onClick={() => sortable && onSort(col)}
        >
            <div className="flex items-center gap-1">
                {label} {sortable && getSortIcon(col)}
            </div>
        </TableHead>
    )

    return (
        <div className="space-y-4">
            <div id="workers-print-area" className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-primary/5 dark:bg-primary-900/20 border-b border-border">
                        <TableRow className="hover:bg-transparent border-border">
                            <Header label="Nombre Completo" col="nombre" />
                            <Header label="CURP" col="curp" />
                            <Header label="Adscripción" col="adscripcion_id" />
                            <Header label="Antigüedad" col="fecha_ingreso" />
                            <Header label="Estatus" col="estatus" />
                            <TableHead className="w-[100px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground pr-6">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="h-8 w-8 opacity-20" />
                                        <p className="font-bold">No se encontraron trabajadores.</p>
                                        <p className="text-xs">Intenta ajustar los filtros o el término de búsqueda.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            workers.map((worker, index) => (
                                <motion.tr
                                    key={worker.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group border-border transition-colors hover:bg-muted/30"
                                >
                                    <TableCell className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">
                                                {highlightText(worker.nombre)} {highlightText(worker.apellido_paterno)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{highlightText(worker.apellido_materno) || ''}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs uppercase tracking-wider">{highlightText(worker.curp)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{highlightText(worker.adscripciones?.nombre || worker.adscripcion_id)}</span>
                                            {worker.unidades?.nombre && <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">{highlightText(worker.unidades.nombre)}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-black">{getSeniority(worker.fecha_ingreso)} <span className="text-[10px] text-muted-foreground uppercase ml-1">AÑOS</span></span>
                                    </TableCell>
                                    <TableCell>{getEstatusBadge(worker.estatus)}</TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted rounded-lg">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-border">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => router.push(`/editar/${worker.id}`)} className="rounded-lg gap-2">
                                                    <Edit className="h-4 w-4" /> Ver / Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-lg gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20" onClick={() => onDelete(worker.id)}>
                                                    <Trash className="h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </motion.tr>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-card border border-border p-4 rounded-2xl shadow-sm">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-2">Página {currentPage} de {totalPages}</p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className="rounded-xl"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            className="rounded-xl"
                        >
                            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
