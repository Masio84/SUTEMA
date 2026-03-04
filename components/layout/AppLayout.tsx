'use client'

import React from 'react'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, UserPlus, FileText, Settings, Search, LogOut } from 'lucide-react'
import { usePathname } from 'next/navigation'

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Consultas', href: '/consultas', icon: <Search className="h-4 w-4" /> },
    { label: 'Registro de Trabajador', href: '/registro', icon: <UserPlus className="h-4 w-4" /> },
    { label: 'Editar Datos', href: '/editar', icon: <Users className="h-4 w-4" /> },
    { label: 'Reportes', href: '/reportes', icon: <FileText className="h-4 w-4" /> },
    { label: 'Configuración', href: '/configuracion', icon: <Settings className="h-4 w-4" /> },
]

export default function AppLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) {
    const pathname = usePathname()

    return (
        <div className="flex h-screen overflow-hidden font-sans">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-72 sidebar-gradient p-8 hidden md:flex flex-col shadow-2xl z-40 relative"
            >
                <div className="mb-12">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-white leading-none">SUTEMA</h2>
                            <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mt-1">Gestión Sindical</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 flex-1">
                    <div>
                        <p className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Menú Principal</p>
                        <nav className="space-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                                return (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        className={`group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${isActive
                                            ? 'bg-white/20 text-white shadow-lg shadow-black/10'
                                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                                            }`}>
                                            {item.icon}
                                        </div>
                                        {item.label}
                                    </a>
                                )
                            })}
                        </nav>
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10">
                    <Button
                        onClick={() => signOut()}
                        variant="ghost"
                        className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white font-bold h-12 rounded-xl"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Cerrar Sesión
                    </Button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-b border-white/20 sticky top-0 z-30 flex items-center justify-between px-8">
                    <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-1 dark:text-zinc-400">
                            <span>SUTEMA</span>
                            <span>/</span>
                            <span className="text-primary font-bold uppercase tracking-widest text-[10px]">{title}</span>
                        </div>
                        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{subtitle || title}</h1>
                    </motion.div>

                    <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-all shadow-md">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs font-black">AD</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    )
}
