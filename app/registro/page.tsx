'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import WorkerForm from '@/components/forms/WorkerForm'
import { createWorker, getAdscripciones } from '../actions/workers'
import { WorkerFormValues } from '@/lib/validations/worker'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function RegistroPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [adscripciones, setAdscripciones] = useState<any[]>([])
    const [isFetching, setIsFetching] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchAdsc = async () => {
            const data = await getAdscripciones()
            setAdscripciones(data)
            setIsFetching(false)
        }
        fetchAdsc()
    }, [])

    const onSubmit = async (data: WorkerFormValues) => {
        setIsLoading(true)
        try {
            const result = await createWorker(data)
            if (result?.error) {
                toast.error("Error al registrar: " + result.error)
            } else {
                toast.success("Trabajador registrado correctamente")
                router.push('/consultas')
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AppLayout title="Registro" subtitle="Nuevo Trabajador">
            <div className="max-w-5xl mx-auto">
                {isFetching ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
                        <p className="text-zinc-500 font-medium">Cargando catálogo...</p>
                    </div>
                ) : (
                    <WorkerForm
                        adscripciones={adscripciones}
                        onSubmit={onSubmit}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </AppLayout>
    )
}
