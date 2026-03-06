import React from 'react'
export const dynamic = "force-dynamic"
import AppLayout from '@/components/layout/AppLayout'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { getDashboardStats, getIncompleteWorkers } from '../actions/workers'

export default async function DashboardPage() {
    const [stats, incompleteData] = await Promise.all([
        getDashboardStats(),
        getIncompleteWorkers()
    ])

    return (
        <AppLayout title="Panel de Control" subtitle="Resumen del Sistema">
            <DashboardClient stats={stats} incompleteData={incompleteData} />
        </AppLayout>
    )
}
