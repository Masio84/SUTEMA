'use client'

import React from 'react'
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
import { MoreHorizontal, Edit, Trash, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export interface Worker {
    id: string
    nombre: string
    apellido_paterno: string
    apellido_materno?: string
    curp: string
    adscripcion_id: string
    unidad_id?: string
    estatus: string
}

interface WorkerTableProps {
    workers: Worker[]
    onDelete: (id: string) => void
}

export default function WorkerTable({ workers, onDelete }: WorkerTableProps) {
    const router = useRouter()

    const getEstatusBadge = (estatus: string) => {
        switch (estatus) {
            case 'Activo': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800">Activo</Badge>
            case 'Inactivo': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800">Inactivo</Badge>
            case 'Jubilado': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">Jubilado</Badge>
            default: return <Badge variant="secondary">{estatus}</Badge>
        }
    }

    return (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
                        <TableHead className="w-[300px] font-bold py-5 px-6">Nombre Completo</TableHead>
                        <TableHead className="font-bold">CURP</TableHead>
                        <TableHead className="font-bold">Adscripción</TableHead>
                        <TableHead className="font-bold">Estatus</TableHead>
                        <TableHead className="w-[100px] text-right font-bold pr-6">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {workers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-48 text-center text-zinc-500">
                                No se encontraron trabajadores.
                            </TableCell>
                        </TableRow>
                    ) : (
                        workers.map((worker, index) => (
                            <motion.tr
                                key={worker.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group border-zinc-100 dark:border-zinc-900 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                            >
                                <TableCell className="py-4 px-6">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-zinc-900 dark:text-zinc-50">{worker.nombre} {worker.apellido_paterno}</span>
                                        <span className="text-xs text-zinc-500">{worker.apellido_materno || ''}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs uppercase tracking-wider">{worker.curp}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{worker.adscripcion_id}</span>
                                        {worker.unidad_id && <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{worker.unidad_id}</span>}
                                    </div>
                                </TableCell>
                                <TableCell>{getEstatusBadge(worker.estatus)}</TableCell>
                                <TableCell className="text-right pr-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-zinc-200 dark:border-zinc-800">
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
    )
}
