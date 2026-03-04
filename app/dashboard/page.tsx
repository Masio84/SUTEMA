import React from 'react'
export const dynamic = "force-dynamic"
import AppLayout from '@/components/layout/AppLayout'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { getDashboardStats } from '../actions/workers'

export default async function DashboardPage() {
    const stats = await getDashboardStats()

    return (
        <AppLayout title="Panel de Control" subtitle="Resumen del Sistema">
            <DashboardClient stats={stats} />
        </AppLayout>
    )
}
