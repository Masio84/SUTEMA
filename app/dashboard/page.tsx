'use client'

import { logout } from '../actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, UserPlus, FileText, Settings, Search, LogOut } from 'lucide-react'

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Consultas', href: '/consultas', icon: <Search className="h-4 w-4" /> },
    { label: 'Registro de Trabajador', href: '/registro', icon: <UserPlus className="h-4 w-4" /> },
    { label: 'Editar Datos', href: '/editar', icon: <Users className="h-4 w-4" /> },
    { label: 'Reportes', href: '/reportes', icon: <FileText className="h-4 w-4" /> },
    { label: 'Configuración', href: '/configuracion', icon: <Settings className="h-4 w-4" /> },
]

import DashboardClient from '@/components/dashboard/DashboardClient'

export default function DashboardPage() {
    return (
        <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-72 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-8 hidden md:flex flex-col shadow-sm"
            >
                <div className="mb-12">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">SUTEMA</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Gestión Sindical</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 flex-1">
                    <div>
                        <p className="px-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Menú Principal</p>
                        <nav className="space-y-2">
                            {navItems.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className={`group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${item.href === '/dashboard'
                                        ? 'bg-zinc-100 dark:bg-zinc-900 text-primary shadow-sm'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-50'
                                        }`}
                                >
                                    <div className={`transition-transform duration-300 group-hover:scale-110 ${item.href === '/dashboard' ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                                        }`}>
                                        {item.icon}
                                    </div>
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-900">
                    <Button
                        onClick={() => logout()}
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 font-bold h-12 rounded-xl"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Cerrar Sesión
                    </Button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-black/50 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-8">
                    <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-1">
                            <span>Panel</span>
                            <span>/</span>
                            <span className="text-primary font-bold">Dashboard de Control</span>
                        </div>
                        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Resumen General</h1>
                    </motion.div>

                    <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-all">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">AD</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                    <DashboardClient />
                </main>
            </div>
        </div>
    )
}
