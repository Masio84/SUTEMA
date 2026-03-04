'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Users,
    UserCheck,
    UserMinus,
    Baby,
    TrendingUp,
    BarChart2,
    PieChart as PieChartIcon
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { motion } from 'framer-motion'

interface DashboardClientProps {
    stats: {
        total: number
        activos: number
        jubilados: number
        conHijos: number
        stats: {
            adscDistrib: { name: string, count: number }[]
        }
    }
}

const COLORS = ['#6B8F71', '#4C6A56', '#8FBF9A', '#A3C2A9', '#5D7A66', '#3D5545', '#7DA185', '#B5D1BC', '#435D4C', '#2E4034']

export default function DashboardClient({ stats }: DashboardClientProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    const metricCards = [
        { title: "Total Registrados", value: stats.total, icon: Users, color: "bg-zinc-100 text-zinc-900 border-zinc-200" },
        { title: "Activos", value: stats.activos, icon: UserCheck, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        { title: "Jubilados", value: stats.jubilados, icon: UserMinus, color: "bg-amber-50 text-amber-700 border-amber-100" },
        { title: "Con Hijos < 12", value: stats.conHijos, icon: Baby, color: "bg-blue-50 text-blue-700 border-blue-100" },
    ]

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricCards.map((card, i) => (
                    <motion.div key={i} variants={item}>
                        <Card className={`rounded-3xl border shadow-sm transition-all hover:shadow-md ${card.color}`}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{card.title}</p>
                                        <h3 className="text-3xl font-black">{card.value}</h3>
                                    </div>
                                    <div className={`p-2 rounded-xl bg-white/50 backdrop-blur-sm border border-white`}>
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={item}>
                    <Card className="bg-card border-border shadow-sm overflow-hidden">
                        <CardHeader className="pb-2 border-b border-zinc-50 dark:border-zinc-900 mx-6 px-0 pt-8">
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
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            width={160}
                                            fontSize={11}
                                            fontWeight={600}
                                        />
                                        <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-xl">
                                                        <p className="text-xs text-zinc-400 font-bold mb-1 uppercase">{payload[0].payload.name}</p>
                                                        <p className="text-lg font-black text-white">{payload[0].value} <span className="text-[10px] uppercase text-zinc-500 ml-1">TRABAJADORES</span></p>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }} />
                                        <Bar
                                            dataKey="count"
                                            fill="#18181b"
                                            radius={[0, 10, 10, 0]}
                                            barSize={20}
                                        >
                                            {stats.stats.adscDistrib.map((entry, index) => (
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
                    <Card className="bg-card border-border shadow-sm overflow-hidden">
                        <CardHeader className="pb-2 border-b border-zinc-50 dark:border-zinc-900 mx-6 px-0 pt-8">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-primary" /> Resumen General
                            </CardTitle>
                            <CardDescription>Proporción de estatus laboral</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 px-6 pb-8 flex flex-col items-center">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Activos', value: stats.activos },
                                                { name: 'Jubilados', value: stats.jubilados },
                                                { name: 'Inactivos', value: stats.total - stats.activos - stats.jubilados }
                                            ]}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill="#6B8F71" />
                                            <Cell fill="#8FBF9A" />
                                            <Cell fill="#e2e8f0" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-6 w-full mt-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#6B8F71] mb-2"></div>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Activos</span>
                                    <span className="text-lg font-black">{Math.round((stats.activos / stats.total) * 100) || 0}%</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#8FBF9A] mb-2"></div>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Jubilados</span>
                                    <span className="text-lg font-black">{Math.round((stats.jubilados / stats.total) * 100) || 0}%</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-zinc-200 mb-2"></div>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Inactivos</span>
                                    <span className="text-lg font-black">{Math.round(((stats.total - stats.activos - stats.jubilados) / stats.total) * 100) || 0}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    )
}
