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

const COLORS = ['#0A4174', '#49769F', '#4E8EA2', '#6EA2B3', '#7BBDE8', '#BDD8E9', '#001D39', '#003366', '#004080', '#0059b3']

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
        { title: "Total Registrados", value: stats.total, icon: Users, color: "text-primary-900 dark:text-white" },
        { title: "Activos", value: stats.activos, icon: UserCheck, color: "text-primary-800 dark:text-primary-400" },
        { title: "Jubilados", value: stats.jubilados, icon: UserMinus, color: "text-primary-700 dark:text-primary-500" },
        { title: "Con Hijos < 12", value: stats.conHijos, icon: Baby, color: "text-primary-600 dark:text-primary-200" },
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
                        <Card className={`glass-card hover:-translate-y-1 ${card.color}`}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/60 mb-1">{card.title}</p>
                                        <h3 className="text-4xl font-black tracking-tighter">{card.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-2xl bg-primary-800/10 dark:bg-primary-800/20 border border-primary-800/10`}>
                                        <card.icon className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

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
                                                    <div className="glass-card p-3 shadow-xl">
                                                        <p className="text-xs text-muted-foreground font-bold mb-1 uppercase">{payload[0].payload.name}</p>
                                                        <p className="text-lg font-black text-foreground">{payload[0].value} <span className="text-[10px] uppercase text-muted-foreground ml-1">TRABAJADORES</span></p>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }} />
                                        <Bar
                                            dataKey="count"
                                            fill="#0A4174"
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
                                            <Cell fill="#0A4174" />
                                            <Cell fill="#49769F" />
                                            <Cell fill="#BDD8E9" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-6 w-full mt-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#0A4174] mb-2"></div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Activos</span>
                                    <span className="text-xl font-black text-primary">{Math.round((stats.activos / stats.total) * 100) || 0}%</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#49769F] mb-2"></div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Jubilados</span>
                                    <span className="text-xl font-black text-primary-700">{Math.round((stats.jubilados / stats.total) * 100) || 0}%</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-[#BDD8E9] mb-2"></div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Inactivos</span>
                                    <span className="text-xl font-black text-primary-400">{Math.round(((stats.total - stats.activos - stats.jubilados) / stats.total) * 100) || 0}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    )
}
