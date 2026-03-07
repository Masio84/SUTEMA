'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet'
import { motion } from 'framer-motion'
import { LayoutDashboard, UserPlus, FileText, Settings, Search, LogOut, FileUp, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { ThemeToggle } from '@/components/theme-toggle'

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Consultas / Edición', href: '/consultas', icon: <Search className="h-4 w-4" /> },
    { label: 'Registro de Trabajador', href: '/registro', icon: <UserPlus className="h-4 w-4" /> },
    { label: 'Importar Excel', href: '/importar', icon: <FileUp className="h-4 w-4" /> },
    { label: 'Reportes', href: '/reportes', icon: <FileText className="h-4 w-4" /> },
    { label: 'Configuración', href: '/configuracion', icon: <Settings className="h-4 w-4" /> },
]

export default function AppLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) {
    const [isMounted, setIsMounted] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const pathname = usePathname()

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const NavLinks = () => (
        <nav className="space-y-1">
            {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                    <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
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
    )

    return (
        <div className="flex h-screen overflow-hidden font-sans">
            {/* Sidebar (Desktop) */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-72 bg-primary-900 p-8 hidden md:flex flex-col shadow-2xl z-40 relative border-r border-white/5"
            >
                <div className="mb-12 flex flex-col items-center text-center">
                    <Image
                        src="/logo-blanco.png"
                        alt="SUTEMA Logo"
                        width={200}
                        height={70}
                        className="object-contain drop-shadow-lg mb-4"
                        priority
                    />
                    <p className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">
                        Sistema Institucional de Gestión Sindical
                    </p>
                </div>

                <div className="space-y-8 flex-1">
                    <div>
                        <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Menú Principal</p>
                        <NavLinks />
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
                <header className="h-16 bg-card border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            {isMounted && (
                                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground mr-2">
                                            <Menu className="h-6 w-6" />
                                            <span className="sr-only">Toggle mobile menu</span>
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-72 bg-primary-900 border-r border-white/5 p-8 flex flex-col">
                                        <SheetHeader className="mb-8">
                                            <SheetTitle className="text-white text-center">
                                                <div className="flex flex-col items-center">
                                                    <Image
                                                        src="/logo-blanco.png"
                                                        alt="SUTEMA Logo"
                                                        width={150}
                                                        height={50}
                                                        className="object-contain drop-shadow-lg mb-4"
                                                        priority
                                                    />
                                                    <p className="text-[10px] text-primary-400 font-bold uppercase tracking-wider">
                                                        Gestión Sindical
                                                    </p>
                                                </div>
                                            </SheetTitle>
                                        </SheetHeader>
                                        <div className="space-y-8 flex-1">
                                            <div>
                                                <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Menú Principal</p>
                                                <NavLinks />
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
                                    </SheetContent>
                                </Sheet>
                            )}
                        </div>

                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-0.5">
                                <span>SUTEMA</span>
                                <span className="hidden sm:inline">/</span>
                                <span className="text-primary hidden sm:inline">{title}</span>
                            </div>
                            <h1 className="text-xl font-black tracking-tighter text-foreground truncate max-w-[200px] sm:max-w-none leading-none">{subtitle || title}</h1>
                        </motion.div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-card border border-border shadow-sm">
                            <Avatar className="h-7 w-7 cursor-pointer hover:scale-110 transition-transform">
                                <AvatarFallback className="bg-primary-900 text-white text-[9px] font-black">AD</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    )
}
