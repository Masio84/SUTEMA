'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users, UserCheck, UserMinus, Baby, BarChart2,
    PieChart as PieChartIcon, AlertTriangle, ArrowRight, CheckCircle2
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

// ── Field label map ────────────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
    curp: 'CURP',
    clave_elector: 'Clave Elector',
    sexo: 'Sexo',
    telefono: 'Teléfono',
    colonia: 'Colonia',
    calle: 'Calle',
    numero_exterior: 'Núm. Ext.',
    municipio: 'Municipio',
    seccion_ine: 'Sección INE',
    estado_civil: 'Estado Civil',
    fecha_nacimiento: 'F. Nacimiento',
}

interface DashboardClientProps {
    stats: {
        total: number
        activos: number
        jubilados: number
        conHijos: number
        stats: { adscDistrib: { name: string; count: number }[] }
    }
    incompleteData: {
        workers: Array<{
            id: string
            nombre: string
            apellido_paterno: string
            apellido_materno?: string
            missingFields: string[]
            adscripciones?: { nombre: string }[] | { nombre: string } | null
        }>
        fieldMissing: Record<string, number>
    }
}

const COLORS = ['#0A4174', '#49769F', '#4E8EA2', '#6EA2B3', '#7BBDE8', '#BDD8E9', '#001D39', '#003366', '#004080', '#0059b3']

export default function DashboardClient({ stats, incompleteData }: DashboardClientProps) {
    const router = useRouter()

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

    const incompleteCount = incompleteData.workers.length
    const incompletePercent = stats.total > 0 ? Math.round((incompleteCount / stats.total) * 100) : 0

    const metricCards = [
        { title: "Total Registrados", value: stats.total, icon: Users, color: "text-primary-900 dark:text-white" },
        { title: "Activos", value: stats.activos, icon: UserCheck, color: "text-primary-800 dark:text-primary-400" },
        { title: "Jubilados", value: stats.jubilados, icon: UserMinus, color: "text-primary-700 dark:text-primary-500" },
        { title: "Con Hijos < 12", value: stats.conHijos, icon: Baby, color: "text-primary-600 dark:text-primary-200" },
        {
            title: "Incompletos", value: incompleteCount, icon: AlertTriangle,
            color: incompleteCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
            highlight: incompleteCount > 0
        },
    ]

    // Field missing chart data (only those with > 0)
    const fieldChartData = Object.entries(incompleteData.fieldMissing)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ field: FIELD_LABELS[k] || k, count: v }))
        .sort((a, b) => b.count - a.count)

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

            {/* ── Metric cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {metricCards.map((card, i) => (
                    <motion.div key={i} variants={item}>
                        <Card className={`glass-card hover:-translate-y-1 transition-transform ${card.color} ${card.highlight ? 'border-amber-300 dark:border-amber-700 shadow-amber-100 dark:shadow-amber-900/20' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/60 mb-1">{card.title}</p>
                                        <h3 className="text-4xl font-black tracking-tighter">{card.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-2xl ${card.highlight ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary-800/10 dark:bg-primary-800/20'} border ${card.highlight ? 'border-amber-200 dark:border-amber-800' : 'border-primary-800/10'}`}>
                                        <card.icon className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={item}>
                    <Card className="glass-card overflow-hidden">
                        <CardHeader className="pb-2 border-b border-border mx-6 px-0 pt-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <BarChart2 className="h-5 w-5 text-primary" /> Distribución por Adscripción
                                    </CardTitle>
                                    <CardDescription>Conteo de trabajadores por cada área principal</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 px-6 pb-8">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.stats.adscDistrib} layout="vertical" margin={{ left: 40, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="opacity-10" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={160} fontSize={11} fontWeight={600} />
                                        <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                                            if (active && payload?.length) {
                                                return (
                                                    <div className="glass-card p-3 shadow-xl">
                                                        <p className="text-xs text-muted-foreground font-bold mb-1 uppercase">{payload[0].payload.name}</p>
                                                        <p className="text-lg font-black text-foreground">{payload[0].value} <span className="text-[10px] uppercase text-muted-foreground ml-1">TRABAJADORES</span></p>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }} />
                                        <Bar dataKey="count" fill="#0A4174" radius={[0, 10, 10, 0]} barSize={20}>
                                            {stats.stats.adscDistrib.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="glass-card overflow-hidden">
                        <CardHeader className="pb-2 border-b border-border mx-6 px-0 pt-8">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-primary" /> Resumen General
                            </CardTitle>
                            <CardDescription>Proporción de estatus laboral</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 px-6 pb-8 flex flex-col items-center">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[
                                            { name: 'Activos', value: stats.activos },
                                            { name: 'Jubilados', value: stats.jubilados },
                                            { name: 'Inactivos', value: stats.total - stats.activos - stats.jubilados }
                                        ]} innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value">
                                            <Cell fill="#0A4174" /><Cell fill="#49769F" /><Cell fill="#BDD8E9" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-6 w-full mt-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#0A4174] mb-2" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Activos</span>
                                    <span className="text-xl font-black text-primary">{Math.round((stats.activos / stats.total) * 100) || 0}%</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#49769F] mb-2" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Jubilados</span>
                                    <span className="text-xl font-black text-primary-700">{Math.round((stats.jubilados / stats.total) * 100) || 0}%</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#BDD8E9] mb-2" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Inactivos</span>
                                    <span className="text-xl font-black text-primary-400">{Math.round(((stats.total - stats.activos - stats.jubilados) / stats.total) * 100) || 0}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* ── Completeness Card ── */}
            <motion.div variants={item}>
                <Card className={`glass-card overflow-hidden ${incompleteCount === 0 ? 'border-emerald-200 dark:border-emerald-800' : 'border-amber-200 dark:border-amber-800'}`}>
                    <CardHeader className="pb-4 border-b border-border mx-6 px-0 pt-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    {incompleteCount === 0
                                        ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                                    Calidad de Datos
                                </CardTitle>
                                <CardDescription>
                                    Registros con campos obligatorios incompletos
                                </CardDescription>
                            </div>
                            <div className={`text-right ${incompleteCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                <p className="text-3xl font-black">{incompleteCount}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{incompletePercent}% del total</p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        {incompleteCount === 0 ? (
                            <div className="flex flex-col items-center py-8 text-emerald-600 dark:text-emerald-400 gap-3">
                                <CheckCircle2 className="h-12 w-12" />
                                <p className="font-black text-lg">¡Todos los registros están completos!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Field completeness chart */}
                                {fieldChartData.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Campos más frecuentemente vacíos</p>
                                        <div className="space-y-3">
                                            {fieldChartData.map(item => (
                                                <div key={item.field} className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-muted-foreground w-28 shrink-0">{item.field}</span>
                                                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full transition-all duration-700"
                                                            style={{ width: `${Math.round((item.count / incompleteCount) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black w-6 text-amber-600">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* List of incomplete workers */}
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
                                        Registros a completar ({Math.min(incompleteCount, 8)} de {incompleteCount})
                                    </p>
                                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
                                        {incompleteData.workers.slice(0, 8).map(w => (
                                            <div key={w.id} className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 group hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate text-foreground">
                                                        {w.nombre} {w.apellido_paterno} {w.apellido_materno || ''}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {w.missingFields.slice(0, 4).map(f => (
                                                            <span key={f} className="text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                                                {FIELD_LABELS[f] || f}
                                                            </span>
                                                        ))}
                                                        {w.missingFields.length > 4 && (
                                                            <span className="text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                                                +{w.missingFields.length - 4} más
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 rounded-xl shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                                    onClick={() => router.push(`/editar/${w.id}`)}
                                                >
                                                    <ArrowRight className="h-4 w-4 text-amber-600" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    {incompleteCount > 8 && (
                                        <Button
                                            variant="ghost"
                                            className="mt-3 w-full text-xs font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl gap-2"
                                            onClick={() => router.push('/consultas')}
                                        >
                                            Ver los {incompleteCount} registros incompletos <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
