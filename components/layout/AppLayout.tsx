'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, UserPlus, FileText, Settings, Search, LogOut, FileUp, Menu, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { ThemeToggle } from '@/components/theme-toggle'

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: 'Consultas / Edición', href: '/consultas', icon: <Search className="h-5 w-5" /> },
    { label: 'Registro de Trabajador', href: '/registro', icon: <UserPlus className="h-5 w-5" /> },
    { label: 'Importar Excel', href: '/importar', icon: <FileUp className="h-5 w-5" /> },
    { label: 'Reportes', href: '/reportes', icon: <FileText className="h-5 w-5" /> },
    { label: 'Comisiones', href: '/comisiones', icon: <Briefcase className="h-5 w-5" /> },
    { label: 'Configuración', href: '/configuracion', icon: <Settings className="h-5 w-5" /> },
]

export default function AppLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) {
    const [isMounted, setIsMounted] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(true)
    const pathname = usePathname()

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const NavLinks = ({ collapsed = false }: { collapsed?: boolean }) => (
        <nav className="space-y-2">
            {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                    <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center transition-all duration-300 ${collapsed ? 'justify-center p-3 px-0' : 'gap-4 px-4 py-3'} rounded-xl text-sm font-bold ${isActive
                            ? 'bg-primary-800 text-white shadow-lg'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                        title={collapsed ? item.label : undefined}
                    >
                        <div className={`transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/30 group-hover:text-white/70'}`}>
                            {item.icon}
                        </div>
                        {!collapsed && (
                            <motion.span 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="truncate"
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </a>
                )
            })}
        </nav>
    )

    return (
        <div className="flex h-screen overflow-hidden font-sans bg-background">
            {/* Sidebar (Desktop) */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 280 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-primary-950 hidden md:flex flex-col shadow-2xl z-40 relative border-r border-white/5 overflow-hidden"
            >
                {/* Logo Area */}
                <div className={`mt-8 mb-12 flex flex-col items-center justify-center transition-all duration-500 ${isCollapsed ? 'px-2' : 'px-8'}`}>
                    <motion.div 
                        animate={{ 
                            scale: isCollapsed ? 0.65 : 1,
                            y: isCollapsed ? -2 : 0
                        }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="relative flex flex-col items-center"
                    >
                        <div className="relative">
                            <Image
                                src="/logo-blanco.png"
                                alt="SUTEMA Logo"
                                width={160}
                                height={50}
                                className="object-contain drop-shadow-xl"
                                priority
                            />
                            {isCollapsed && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute -top-2 -right-2 w-4 h-4 bg-primary-500 rounded-full animate-pulse shadow-lg shadow-primary-500/50"
                                />
                            )}
                        </div>
                        
                        {!isCollapsed && (
                            <motion.p 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-[9px] text-primary-400 font-bold uppercase tracking-[0.2em] mt-3 whitespace-nowrap"
                            >
                                Gestión Sindical
                            </motion.p>
                        )}
                    </motion.div>
                </div>

                {/* Navigation */}
                <div className={`flex-1 ${isCollapsed ? 'px-4' : 'px-8'} space-y-8 overflow-y-auto custom-scrollbar`}>
                    <div>
                        {!isCollapsed && (
                            <p className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Menú Principal</p>
                        )}
                        <NavLinks collapsed={isCollapsed} />
                    </div>
                </div>

                <div className="p-4 mt-auto border-t border-white/5 flex flex-col gap-4 relative">
                    <Button
                        onClick={() => signOut()}
                        variant="ghost"
                        className={`text-white/50 hover:bg-destructive/10 hover:text-white font-bold h-12 rounded-2xl transition-all duration-300 ${isCollapsed ? 'p-0 w-12 mx-auto justify-center' : 'w-full px-4 justify-start'}`}
                        title={isCollapsed ? "Cerrar Sesión" : undefined}
                    >
                        <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                        {!isCollapsed && <span>Cerrar Sesión</span>}
                    </Button>

                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-end pr-2'}`}>
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="group relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/40 shadow-inner ring-1 ring-white/10 transition-all hover:bg-primary hover:text-white hover:ring-primary/20 active:scale-90"
                        >
                            <motion.div
                                animate={{ rotate: isCollapsed ? 180 : 0 }}
                                transition={{ duration: 0.5, ease: "backOut" }}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </motion.div>
                            
                            {/* Hover glow effect */}
                            <div className="absolute inset-0 rounded-2xl bg-primary opacity-0 blur-lg transition-opacity group-hover:opacity-20" />
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-background transition-all duration-300">
                <header className="h-16 bg-background/90 backdrop-blur-md border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
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
                                    <SheetContent side="left" className="w-[300px] bg-primary-950 border-r border-white/5 p-8 flex flex-col">
                                        <SheetHeader className="mb-10">
                                            <SheetTitle className="text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-primary dark:bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                                        <Briefcase className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h1 className="text-xl font-black tracking-tight text-primary-900 dark:text-white leading-none">SUTEMA</h1>
                                                        <p className="text-[9px] font-bold text-primary-500/80 dark:text-primary-400 uppercase tracking-widest mt-0.5">Gestión Sindical</p>
                                                    </div>
                                                </div>
                                            </SheetTitle>
                                        </SheetHeader>
                                        <div className="flex-1 overflow-y-auto">
                                            <NavLinks />
                                        </div>
                                        <div className="pt-6 mt-6 border-t border-white/10">
                                            <Button
                                                onClick={() => signOut()}
                                                variant="ghost"
                                                className="w-full justify-start text-white/50 hover:bg-destructive/10 hover:text-destructive font-bold h-12 rounded-xl"
                                            >
                                                <LogOut className="h-5 w-5 mr-3" />
                                                Cerrar Sesión
                                            </Button>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 hidden sm:flex"
                            >
                                <Briefcase className="w-5 h-5 text-white" />
                            </motion.div>
                            <motion.div
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="min-w-0"
                            >
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-0.5">
                                    <span className="hover:text-primary cursor-default transition-colors hidden xs:inline">SUTEMA</span>
                                    <span className="opacity-30 hidden xs:inline">/</span>
                                    <span className="text-primary truncate">{title}</span>
                                </div>
                                <h1 className="text-xl font-bold tracking-tighter text-foreground truncate max-w-[150px] sm:max-w-none leading-none">{subtitle || title}</h1>
                            </motion.div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-sm group hover:border-primary/50 transition-colors">
                            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                <AvatarFallback className="bg-primary-900 text-white text-[10px] font-black">AD</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 custom-scrollbar bg-background/50">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
