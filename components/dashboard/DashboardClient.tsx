'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Users, Baby,
    PieChart as PieChartIcon, AlertTriangle, ArrowRight, CheckCircle2,
    FileText,
    Briefcase
} from 'lucide-react'
import {
    PieChart, Pie, Cell, Sector, ResponsiveContainer, Tooltip as RechartsTooltip
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
        jubilados: number
        conHijos: number
        papas: number
        mamas: number
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

            {/* ── Main Dashboard Panel (Top Row) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Demographics Overview */}
                <motion.div variants={item}>
                    <Card className="glass-card overflow-hidden h-full flex flex-col">
                        <CardHeader className="pb-3 border-b border-border mx-5 px-0 pt-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> Demografía Familiar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 px-6 pb-6 flex-1 flex flex-col">
                            <div className="space-y-6 flex-1 flex flex-col justify-around">
                                {/* Waffle Grid Chart (Novel Visualization) */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center text-muted-foreground">Distribución Proporcional (Papás vs Mamás)</p>
                                    <div className="flex flex-col items-center">
                                        <div className="grid grid-cols-10 gap-1 mb-4 p-2 bg-muted/20 rounded-xl border border-border/50">
                                            {Array.from({ length: 100 }).map((_, i) => {
                                                const totalParents = stats.papas + stats.mamas
                                                const papasRatio = totalParents > 0 ? (stats.papas / totalParents) : 0.5
                                                const threshold = Math.round(papasRatio * 100)
                                                const isPapa = i < threshold
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className={`w-2 h-2 rounded-full transition-all duration-500 hover:scale-150 ${isPapa ? 'bg-[#3b82f6] shadow-[0_0_5px_#3b82f644]' : 'bg-[#ec4899] shadow-[0_0_5px_#ec489944]'}`}
                                                        title={isPapa ? 'Representación Papás' : 'Representación Mamás'}
                                                    />
                                                )
                                            })}
                                        </div>
                                        <div className="flex gap-4 justify-center">
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight">
                                                <div className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Papás ({stats.papas})
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight">
                                                <div className="w-2 h-2 rounded-full bg-[#ec4899]" /> Mamás ({stats.mamas})
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Vertical Stats */}
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-3.5 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary rounded-xl text-white">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-tight text-muted-foreground">Total Padrón</span>
                                        </div>
                                        <span className="text-2xl font-black">{stats.total}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500 rounded-xl text-white">
                                                <Baby className="h-4 w-4" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-tight text-muted-foreground">Hijos &lt; 12</span>
                                        </div>
                                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.conHijos}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 2. Interactive Distribution by Adscripcion */}
                <motion.div variants={item}>
                    <Card className="glass-card overflow-hidden h-full flex flex-col">
                        <CardHeader className="pb-3 border-b border-border mx-5 px-0 pt-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <PieChartIcon className="h-4 w-4 text-primary" /> Distribución por Área
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 px-5 pb-5 flex-1 flex flex-col">
                            {pieData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <p className="font-bold text-sm">Sin datos disponibles</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 h-full">
                                    <div className="h-[180px] w-full shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    {...{
                                                        data: pieData,
                                                        dataKey: 'total',
                                                        nameKey: 'name',
                                                        cx: '50%', cy: '50%',
                                                        innerRadius: 50, outerRadius: 75,
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

                                    {/* Detail panel */}
                                    {activeAdsc && (
                                        <div className="rounded-2xl border border-border bg-muted/20 p-3 space-y-2 shrink-0">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ background: COLORS[activeAdscIdx % COLORS.length] }}
                                                />
                                                <p className="font-black text-[10px] uppercase truncate flex-1">{activeAdsc.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <div className="flex items-center justify-between px-2 py-1 bg-background/50 rounded-lg">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Total</span>
                                                    <span className="text-xs font-black">{activeAdsc.total}</span>
                                                </div>
                                                <div className="flex items-center justify-between px-2 py-1 bg-emerald-500/10 rounded-lg">
                                                    <span className="text-[9px] font-bold text-emerald-600 uppercase leading-none">Activos</span>
                                                    <span className="text-xs font-black text-emerald-600">{activeAdsc.activos}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Legend simplified */}
                                    <div className="flex flex-wrap gap-1 mt-auto max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                                        {pieData.map((d, i) => (
                                            <button
                                                key={d.name}
                                                onClick={() => setActiveAdscIdx(i)}
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${activeAdscIdx === i ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                                <span className="truncate max-w-[80px]">{d.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 3. Quick Reports Section */}
                <motion.div variants={item}>
                    <Card className="glass-card overflow-hidden h-full flex flex-col">
                        <CardHeader className="pb-3 border-b border-border mx-5 px-0 pt-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                                <FileText className="h-4 w-4" /> Reportes Rápidos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 px-6 pb-6 flex-1">
                            <div className="space-y-3">
                                {[
                                    { 
                                        label: 'Papás Sindicalizados', 
                                        icon: Users, 
                                        color: 'text-blue-500', 
                                        bg: 'bg-blue-500/10',
                                        href: '/reportes?sexo=Masculino&tiene_hijos=true' 
                                    },
                                    { 
                                        label: 'Mamás Sindicalizadas', 
                                        icon: Users, 
                                        color: 'text-pink-500', 
                                        bg: 'bg-pink-500/10',
                                        href: '/reportes?sexo=Femenino&tiene_hijos=true' 
                                    },
                                    { 
                                        label: 'Hijos menores de 12 años', 
                                        icon: Baby, 
                                        color: 'text-indigo-500', 
                                        bg: 'bg-indigo-500/10',
                                        href: '/reportes?hijos_menores_12=true' 
                                    },
                                    { 
                                        label: 'Reporte Completo por Unidad', 
                                        icon: Briefcase, 
                                        color: 'text-slate-600 dark:text-slate-400', 
                                        bg: 'bg-slate-500/10',
                                        href: '/reportes?sortCol=unidad_id' 
                                    },
                                ].map((row, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => router.push(row.href)}
                                        className="w-full group flex items-center justify-between p-3.5 rounded-2xl border border-border/50 bg-muted/20 hover:bg-white dark:hover:bg-primary-900 transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${row.bg} ${row.color}`}>
                                                <row.icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80 group-hover:text-foreground">
                                                {row.label}
                                            </span>
                                        </div>
                                        <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                        <div className="p-4 bg-muted/30 border-t border-border mt-auto">
                            <p className="text-[9px] font-bold text-muted-foreground text-center uppercase tracking-[0.2em]">
                                Acceso Directo de Administración
                            </p>
                        </div>
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
