'use client'

import React, { useEffect, useState, use } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import WorkerForm from '@/components/forms/WorkerForm'
import { getWorkerById, updateWorker } from '../../actions/workers'
import { WorkerFormValues } from '@/lib/validations/worker'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditarPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [worker, setWorker] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function load() {
            const data = await getWorkerById(id)
            if (data) {
                setWorker(data)
            } else {
                toast.error("No se encontró el trabajador")
                router.push('/consultas')
            }
            setIsLoading(false)
        }
        load()
    }, [id])

    const onSubmit = async (values: WorkerFormValues) => {
        setIsUpdating(true)
        try {
            const result = await updateWorker(id, values)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Trabajador actualizado")
                router.push('/consultas')
            }
        } catch (e) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsUpdating(false)
        }
    }

    if (isLoading) {
        return (
            <AppLayout title="Editar" subtitle="Cargando...">
                <div className="flex items-center justify-center min-h-[50vh]">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-800 rounded-full"
                    />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout title="Editar" subtitle={`${worker.nombre} ${worker.apellido_paterno}`}>
            <div className="max-w-5xl mx-auto space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="rounded-xl h-10 gap-2 mb-4 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                    <ArrowLeft className="h-4 w-4" /> Regresar
                </Button>
                <WorkerForm
                    onSubmit={onSubmit}
                    isLoading={isUpdating}
                    initialData={{
                        ...worker,
                        fecha_ingreso: new Date(worker.fecha_ingreso)
                    }}
                />
            </div>
        </AppLayout>
    )
}
