'use client'

import React, { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import WorkerTable, { Worker } from '@/components/tables/WorkerTable'
import { getWorkers, deleteWorker } from '@/app/actions/workers'
import { Search, Filter, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PER_PAGE } from '@/app/consultas/page'

export default function EditarPage() {
    const [workers, setWorkers] = useState<Worker[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [sortCol, setSortCol] = useState('nombre')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    const fetchWorkers = useCallback(async () => {
        setIsLoading(true)
        const result = await getWorkers({
            page,
            search,
            sortCol,
            sortOrder
        })
        setWorkers(result.data)
        setTotalCount(result.count)
        setIsLoading(false)
    }, [page, search, sortCol, sortOrder])

    useEffect(() => {
        fetchWorkers()
    }, [fetchWorkers])

    const handleDelete = async (id: string) => {
        if (confirm('¿Está seguro de eliminar este registro?')) {
            const result = await deleteWorker(id)
            if (result.success) {
                toast.success('Trabajador eliminado')
                fetchWorkers()
            } else {
                toast.error('Error al eliminar')
            }
        }
    }

    const totalPages = Math.ceil(totalCount / PER_PAGE)

    return (
        <AppLayout title="Edición de Datos" subtitle="Seleccione un trabajador para modificar">
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-primary-800/10 text-primary-800 border border-primary-800/10 dark:bg-primary-400/10 dark:text-primary-400">
                                <Search className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tighter text-primary-950 dark:text-white">Buscador para Edición</h3>
                                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-0.5">Localice al trabajador que desea actualizar en la columna de acciones</p>
                            </div>
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-2 rounded-[2.5rem]"
                >
                    <WorkerTable
                        workers={workers}
                        onDelete={handleDelete}
                        onPageChange={setPage}
                        currentPage={page}
                        totalPages={totalPages}
                        onSort={(col) => {
                            if (col === sortCol) {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                            } else {
                                setSortCol(col)
                                setSortOrder('asc')
                            }
                        }}
                        sortCol={sortCol}
                        sortOrder={sortOrder}
                        searchTerm={search}
                    />
                </motion.div>

                <div className="bg-primary-900/5 dark:bg-primary-400/5 border border-primary-900/10 dark:border-primary-400/10 p-6 rounded-[2rem] flex gap-4">
                    <AlertCircle className="h-6 w-6 text-primary-800 dark:text-primary-400 shrink-0" />
                    <div>
                        <p className="font-black text-primary-900 dark:text-primary-200 text-sm uppercase tracking-tight">Instrucciones de Edición</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            Utilice el buscador para filtrar por nombre o CURP. Una vez localizado el trabajador, haga clic en el icono de edición <span className="font-bold">(&hellip;)</span> al final de la fila para abrir el formulario de modificación.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
