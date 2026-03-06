'use client'

import React from 'react'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, UserPlus, FileText, Settings, Search, LogOut, FileUp } from 'lucide-react'
import { usePathname } from 'next/navigation'

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Consultas', href: '/consultas', icon: <Search className="h-4 w-4" /> },
    { label: 'Registro de Trabajador', href: '/registro', icon: <UserPlus className="h-4 w-4" /> },
    { label: 'Editar Datos', href: '/editar', icon: <Users className="h-4 w-4" /> },
    { label: 'Importar Excel', href: '/importar', icon: <FileUp className="h-4 w-4" /> },
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
                className="w-72 bg-primary-900 p-8 hidden md:flex flex-col shadow-2xl z-40 relative border-r border-white/5"
            >
                <div className="mb-12">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary-800 flex items-center justify-center text-white border border-white/10 shadow-lg">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-white leading-none">SUTEMA</h2>
                            <p className="text-[10px] text-primary-400 font-bold uppercase tracking-wider mt-1">Gestión Sindical</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 flex-1">
                    <div>
                        <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Menú Principal</p>
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                                return (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        className={`group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${isActive
                                            ? 'bg-primary-800 text-white shadow-lg shadow-black/20'
                                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-white/30 group-hover:text-white/70'
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
                        className="w-full justify-start text-white/70 hover:bg-white/5 hover:text-white font-bold h-12 rounded-xl"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Cerrar Sesión
                    </Button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-card border-b border-border sticky top-0 z-30 flex items-center justify-between px-8">
                    <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-1">
                            <span>SUTEMA</span>
                            <span>/</span>
                            <span className="text-primary">{title}</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter text-foreground">{subtitle || title}</h1>
                    </motion.div>

                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-sm">
                            <Avatar className="h-8 w-8 cursor-pointer hover:scale-110 transition-transform">
                                <AvatarFallback className="bg-primary-900 text-white text-[10px] font-black">AD</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    )
}
