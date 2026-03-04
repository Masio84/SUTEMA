'use client'

import React, { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import WorkerForm from '@/components/forms/WorkerForm'
import { createWorker } from '../actions/workers'
import { WorkerFormValues } from '@/lib/validations/worker'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function RegistroPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

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
                <WorkerForm onSubmit={onSubmit} isLoading={isLoading} />
            </div>
        </AppLayout>
    )
}
