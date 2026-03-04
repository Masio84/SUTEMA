'use client'

import React, { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import WorkerTable, { Worker } from '@/components/tables/WorkerTable'
import { getWorkers, deleteWorker } from '../actions/workers'
import { Input } from '@/components/ui/input'
import { Search, Filter, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function ConsultasPage() {
    const [workers, setWorkers] = useState<Worker[]>([])
    const [search, setSearch] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    const fetchWorkers = async () => {
        setIsLoading(true)
        const data = await getWorkers(search)
        setWorkers(data as Worker[])
        setIsLoading(false)
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWorkers()
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    const handleDelete = async (id: string) => {
        if (confirm('¿Está seguro de eliminar este registro?')) {
            const result = await deleteWorker(id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Trabajador eliminado")
                fetchWorkers()
            }
        }
    }

    return (
        <AppLayout title="Consultas" subtitle="Gestión de Trabajadores">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Buscar por nombre, CURP..."
                            className="pl-11 h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-zinc-400/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button variant="outline" className="rounded-2xl h-12 gap-2 border-zinc-200 dark:border-zinc-800">
                            <Filter className="h-4 w-4" /> Filtros
                        </Button>
                        <Button className="rounded-2xl h-12 bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 gap-2 px-6" onClick={() => router.push('/registro')}>
                            <Plus className="h-4 w-4" /> Registrar Nuevo
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-800 rounded-full"
                        />
                    </div>
                ) : (
                    <WorkerTable workers={workers} onDelete={handleDelete} />
                )}
            </div>
        </AppLayout>
    )
}
