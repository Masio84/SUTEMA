'use client'

import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import {
    Users,
    UserCheck,
    UserCheck2,
    Baby,
    AlertCircle,
    TrendingUp,
    MapPin,
    CircleUser,
    Heart,
    Calendar,
} from 'lucide-react'

// Mock Data
const adscripcionData = [
    { name: 'Oficinas Centrales', value: 450 },
    { name: 'Hospital Tercer Milenio', value: 300 },
    { name: 'Hospital de la Mujer', value: 250 },
    { name: 'Jurisdicción No. 1', value: 180 },
    { name: 'Jurisdicción No. 2', value: 140 },
]

const municipalityData = [
    { name: 'Aguascalientes', total: 850 },
    { name: 'Jesús María', total: 120 },
    { name: 'Pabellón de Arteaga', total: 95 },
    { name: 'Rincón de Romos', total: 80 },
    { name: 'Calvillo', total: 65 },
]

const sexData = [
    { name: 'Mujeres', value: 742 },
    { name: 'Hombres', value: 506 },
]

const maritalStatusData = [
    { name: 'Casado/a', value: 650 },
    { name: 'Soltero/a', value: 420 },
    { name: 'Unión Libre', value: 120 },
    { name: 'Divorciado/a', value: 45 },
    { name: 'Viudo/a', value: 13 },
]

const seniorityData = [
    { range: '0-5 años', workers: 320 },
    { range: '5-10 años', workers: 450 },
    { range: '10-20 años', workers: 280 },
    { range: '20-30 años', workers: 140 },
    { range: '30+ años', workers: 58 },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const incompleteRecords = [
    { id: 1, name: 'Sánchez García, María Elena', missing: 'CURP, Seccion INE', progress: 85 },
    { id: 2, name: 'Rodríguez López, Carlos', missing: 'Documento Acta de Nacimiento', progress: 92 },
    { id: 3, name: 'González Martínez, Juan', missing: 'Firma de Contrato, Municipio', progress: 75 },
    { id: 4, name: 'Pérez Torres, Ana Rosa', missing: 'Clave Elector (Incorrecto)', progress: 95 },
]

const dashboardStats = [
    { title: 'Total Trabajadores Registrados', value: '1,248', icon: <Users className="h-5 w-5" />, trend: '+4 este mes', color: 'bg-primary/20 text-primary' },
    { title: 'Trabajadores Activos', value: '1,120', icon: <UserCheck className="h-5 w-5" />, trend: '90% del total', color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
    { title: 'Trabajadores Jubilados', value: '128', icon: <UserCheck2 className="h-5 w-5" />, trend: '10% del total', color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' },
    { title: 'Con hijos < 12 años', value: '456', icon: <Baby className="h-5 w-5" />, trend: '36.5% de población', color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400' },
]

export default function DashboardClient() {
    return (
        <div className="space-y-8 pb-10">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardStats.map((stat, idx) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-lg shadow-zinc-200/40 dark:shadow-none hover:shadow-xl transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.title}</CardTitle>
                                <div className={`p-2 rounded-xl ${stat.color}`}>
                                    {stat.icon}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold tracking-tight">{stat.value}</div>
                                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {stat.trend}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workers Distribution by Adscripción */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-500" /> Distribución por Adscripción
                            </CardTitle>
                            <CardDescription>Cantidad de trabajadores por sede principal</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={adscripcionData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fontSize: 11 }}
                                        width={150}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Workers by Municipality */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <TrendingUp className="h-5 w-5 text-green-500" /> Presencia por Municipio
                            </CardTitle>
                            <CardDescription>Concentración de residencia del personal</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={municipalityData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', background: 'white', border: '1px solid #f4f4f5' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', r: 4 }}
                                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Workers by Sex */}
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-md lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CircleUser className="h-5 w-5 text-pink-500" /> Por Género
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6 h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sexData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sexData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Workers by Marital Status */}
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-md lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-500" /> Estado Civil
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={maritalStatusData}>
                                <XAxis dataKey="name" hide />
                                <Tooltip />
                                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Seniority Ranges */}
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-md lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-indigo-500" /> Antigüedad
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={seniorityData}>
                                <XAxis dataKey="range" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="workers" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Incomplete Records Widget */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-lg border-l-4 border-l-red-500 bg-white dark:bg-zinc-950 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500" /> Expedientes Incompletos
                            </CardTitle>
                            <CardDescription>Usuarios con documentación pendiente o errores en el registro.</CardDescription>
                        </div>
                        <Badge variant="destructive" className="animate-pulse">Atención Requerida</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {incompleteRecords.map((record) => (
                                <div key={record.id} className="group p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/80">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border-2 border-white dark:border-zinc-800 shadow-sm">
                                                <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-xs font-bold">{record.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{record.name}</p>
                                                <p className="text-xs text-zinc-500">Pendiente: {record.missing}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{record.progress}%</span>
                                        </div>
                                    </div>
                                    <Progress value={record.progress} className="h-1.5 bg-zinc-200 dark:bg-zinc-800" indicatorClassName="bg-red-500" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
