'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users, UserCheck, Baby, BarChart2,
    PieChart as PieChartIcon, AlertTriangle, ArrowRight, CheckCircle2,
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Sector
} from 'recharts'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

// ── Field label map ────────────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
    curp: 'CURP', clave_elector: 'Clave Elector', sexo: 'Sexo',
    telefono: 'Teléfono', colonia: 'Colonia', calle: 'Calle',
    numero_exterior: 'Núm. Ext.', municipio: 'Municipio',
    seccion_ine: 'Sección INE', estado_civil: 'Estado Civil',
    fecha_nacimiento: 'F. Nacimiento',
}

// ── Color palette ──────────────────────────────────────────────
const COLORS = [
    '#0A4174', '#1B5EA0', '#2B74C0', '#3A8BD4', '#4EA4E4',
    '#49769F', '#5A8FAE', '#6EA2B3', '#7BBDE8', '#BDD8E9',
    '#003366', '#004080', '#0059b3', '#0073e6', '#3399ff',
]

// ── Types ──────────────────────────────────────────────────────
interface AdscDetailed {
    name: string
    total: number
    activos: number
    jubilados: number
    inactivos: number
    bajas: number
    conHijos: number
    incompletos: number
}

interface DashboardClientProps {
    stats: {
        total: number
        activos: number
        conHijos: number
        stats: {
            adscDistrib: { name: string; count: number }[]
            adscDetailed: AdscDetailed[]
        }
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

// ── Custom ActiveShape for the pie ─────────────────────────────
const renderActiveShape = (props: any) => {
    const {
        cx, cy, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, percent
    } = props
    const d = payload as AdscDetailed
    const completos = d.total - d.incompletos

    return (
        <g>
            {/* Enlarged slice */}
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10}
                startAngle={startAngle} endAngle={endAngle} fill={fill} />
            {/* Outer ring accent */}
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 14} outerRadius={outerRadius + 18}
                startAngle={startAngle} endAngle={endAngle} fill={fill} />
            {/* Center big number */}
            <text x={cx} y={cy - 18} textAnchor="middle" className="fill-foreground" style={{ fontSize: 28, fontWeight: 900, fill: 'currentColor' }}>
                {d.total}
            </text>
            <text x={cx} y={cy + 8} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>
                TRABAJADORES
            </text>
            <text x={cx} y={cy + 28} textAnchor="middle" style={{ fontSize: 12, fontWeight: 600, fill: 'currentColor' }}>
                {(percent * 100).toFixed(1)}% del total
            </text>
        </g>
    )
}

// ── Stat pill ──────────────────────────────────────────────────
function Pill({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl border border-current/10 ${color}`}>
            <span className="text-[10px] font-black uppercase tracking-wider opacity-90">{label}</span>
            <span className="text-base font-black">{value}</span>
        </div>
    )
}

export default function DashboardClient({ stats, incompleteData }: DashboardClientProps) {
    const router = useRouter()
    const [activeAdscIdx, setActiveAdscIdx] = useState(0)

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

    const incompleteCount = incompleteData.workers.length
    const incompletePercent = stats.total > 0 ? Math.round((incompleteCount / stats.total) * 100) : 0

    const metricCards = [
        { title: "Total Registrados", value: stats.total ?? 0, icon: Users, color: "from-primary to-slate-950", iconBg: "bg-primary", glow: "bg-primary/10" },
        { title: "Activos", value: stats.activos ?? 0, icon: UserCheck, color: "from-blue-600 to-blue-950", iconBg: "bg-blue-600", glow: "bg-blue-500/10" },
        { title: "Con Hijos < 12", value: stats.conHijos ?? 0, icon: Baby, color: "from-indigo-600 to-indigo-950", iconBg: "bg-indigo-600", glow: "bg-indigo-500/10" },
        {
            title: "Incompletos", value: incompleteCount ?? 0, icon: AlertTriangle,
            color: (incompleteCount ?? 0) > 0 ? "from-red-600 to-red-950" : "from-emerald-600 to-emerald-950",
            iconBg: (incompleteCount ?? 0) > 0 ? "bg-red-600" : "bg-emerald-600",
            glow: (incompleteCount ?? 0) > 0 ? "bg-red-500/10" : "bg-emerald-500/10",
            highlight: (incompleteCount ?? 0) > 0
        },
    ]

    const pieData = stats.stats.adscDetailed.filter(a => a.total > 0)

    // Active adscripcion for hover detail panel
    const activeAdsc: AdscDetailed | null = pieData[activeAdscIdx] ?? null

    const completosPct = activeAdsc
        ? Math.round(((activeAdsc.total - activeAdsc.incompletos) / activeAdsc.total) * 100)
        : 0

    // Field completeness chart data
    const fieldChartData = Object.entries(incompleteData.fieldMissing)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ field: FIELD_LABELS[k] || k, count: v }))
        .sort((a, b) => b.count - a.count)

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

            {/* ── Metric cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricCards.map((card, i) => (
                    <motion.div key={i} variants={item}>
                        <Card className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-md ${
                            card.highlight ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'
                        }`}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
                                        {card.title}
                                    </p>
                                    <div className={`p-2.5 rounded-xl ${card.iconBg} text-white shadow-md`}>
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="relative group/num">
                                    {/* Subtle Glow background */}
                                    <div className={`absolute -inset-4 rounded-full blur-2xl opacity-0 group-hover/num:opacity-100 transition-opacity duration-500 ${card.glow}`} />
                                    
                                    <div className="relative flex items-baseline gap-2">
                                        <motion.h3 
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                            className={`text-6xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-br ${card.color} drop-shadow-sm select-none`}
                                        >
                                            {String(card.value)}
                                        </motion.h3>
                                        {card.highlight && (
                                            <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase self-center shadow-sm">
                                                Revisar
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            
                            {/* Subtle accent line at the bottom */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.iconBg} opacity-50`} />
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar chart – distribución */}
                <motion.div variants={item}>
                    <Card className="glass-card overflow-hidden">
                        <CardHeader className="pb-3 border-b border-border mx-5 px-0 pt-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-primary" /> Distribución por Adscripción
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 px-5 pb-6">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.stats.adscDistrib} layout="vertical" margin={{ left: 40, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="opacity-10" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={160} fontSize={11} fontWeight={600} />
                                        <RechartsTooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null
                                            const name = payload[0].payload.name
                                            const detail = pieData.find(d => d.name === name)
                                            if (!detail) return null
                                            return (
                                                <div className="glass-card p-4 shadow-xl space-y-1 min-w-[180px]">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{detail.name}</p>
                                                    <p className="text-xl font-black">{detail.total} <span className="text-[10px] text-muted-foreground uppercase">trabajadores</span></p>
                                                    <div className="border-t border-border pt-2 space-y-1">
                                                        <p className="text-xs flex justify-between"><span className="text-emerald-600 font-bold">✓ Activos</span><span className="font-black">{detail.activos}</span></p>
                                                        <p className="text-xs flex justify-between"><span className="text-blue-500 font-bold">● Jubilados</span><span className="font-black">{detail.jubilados}</span></p>
                                                        {detail.inactivos > 0 && <p className="text-xs flex justify-between"><span className="text-amber-500 font-bold">○ Inactivos</span><span className="font-black">{detail.inactivos}</span></p>}
                                                        {detail.bajas > 0 && <p className="text-xs flex justify-between"><span className="text-red-500 font-bold">✕ Bajas</span><span className="font-black">{detail.bajas}</span></p>}
                                                        <p className="text-xs flex justify-between"><span className="text-purple-500 font-bold">♥ Con hijos</span><span className="font-black">{detail.conHijos}</span></p>
                                                        {detail.incompletos > 0 && <p className="text-xs flex justify-between"><span className="text-amber-600 font-bold">⚠ Incompletos</span><span className="font-black">{detail.incompletos}</span></p>}
                                                    </div>
                                                </div>
                                            )
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

                {/* Pie chart – resumen por adscripcion with hover detail */}
                <motion.div variants={item}>
                    <Card className="glass-card overflow-hidden">
                        <CardHeader className="pb-3 border-b border-border mx-5 px-0 pt-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <PieChartIcon className="h-4 w-4 text-primary" /> Resumen por Área
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 px-5 pb-5">
                            {pieData.length === 0 ? (
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    <p className="font-bold text-sm">Sin datos disponibles</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {/* Pie */}
                                    <div className="h-[240px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    {...{
                                                        data: pieData,
                                                        dataKey: 'total',
                                                        nameKey: 'name',
                                                        cx: '50%', cy: '50%',
                                                        innerRadius: 65, outerRadius: 95,
                                                        paddingAngle: 3,
                                                        activeIndex: activeAdscIdx,
                                                        activeShape: renderActiveShape,
                                                        onMouseEnter: (_: any, index: number) => setActiveAdscIdx(index),
                                                        onClick: (_: any, index: number) => setActiveAdscIdx(index),
                                                    } as any}
                                                >
                                                    {pieData.map((_, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={COLORS[index % COLORS.length]}
                                                            stroke="transparent"
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Detail panel for active adscripcion */}
                                    {activeAdsc && (
                                        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ background: COLORS[activeAdscIdx % COLORS.length] }}
                                                />
                                                <p className="font-black text-xs truncate">{activeAdsc.name}</p>
                                                <span className="ml-auto text-[10px] font-black text-muted-foreground">{activeAdsc.total} trabajadores</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Pill label="Activos" value={activeAdsc.activos} color="bg-emerald-100/50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400" />
                                                <Pill label="Jubilados" value={activeAdsc.jubilados} color="bg-blue-100/50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400" />
                                                <Pill label="Inactivos" value={activeAdsc.inactivos} color="bg-amber-100/50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400" />
                                                <Pill label="Bajas" value={activeAdsc.bajas} color="bg-red-100/50 text-red-800 dark:bg-red-500/10 dark:text-red-400" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Legend dots */}
                                    <div className="flex flex-wrap gap-2">
                                        {pieData.map((d, i) => (
                                            <button
                                                key={d.name}
                                                onClick={() => setActiveAdscIdx(i)}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${activeAdscIdx === i ? 'bg-muted shadow-sm' : 'hover:bg-muted/50'}`}
                                            >
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                                <span className="truncate max-w-[80px]">{d.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                                <CardDescription>Registros con campos obligatorios incompletos</CardDescription>
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

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
                                        Registros a completar ({Math.min(incompleteCount, 8)} de {incompleteCount})
                                    </p>
                                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
                                        {incompleteData.workers.slice(0, 8).map(w => (
                                            <div key={w.id} className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 group hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">
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
                                                    size="sm" variant="ghost"
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
                                            className="mt-3 w-full text-xs font-black uppercase tracking-widest text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl gap-2"
                                            onClick={() => router.push('/consultas')}
                                        >
                                            Ver todos los {incompleteCount} registros <ArrowRight className="h-3 w-3" />
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
