'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast.error("Credenciales inválidas. " + error.message)
            setIsLoading(false)
        } else {
            toast.success("Bienvenido al sistema")
            router.push('/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background">
            {/* Left Column: Branding */}
            <div className="hidden md:flex md:w-1/2 bg-primary-950 flex-col items-center justify-center p-12 relative overflow-hidden">
                {/* Subtle background pattern/glow */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-800/20 via-primary-950 to-primary-950 opacity-80" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 flex flex-col items-center text-center"
                >
                    <div className="mb-4 flex items-center justify-center">
                        <Image
                            src="/logo-blanco.png"
                            alt="Logo SUTEMA"
                            width={320}
                            height={120}
                            className="object-contain drop-shadow-2xl"
                            priority
                        />
                    </div>
                    <p className="text-primary-200 font-bold uppercase tracking-widest text-sm max-w-sm">
                        Sistema Institucional de Gestión Sindical
                    </p>
                </motion.div>

                <div className="absolute bottom-8 text-center w-full text-primary-400/50 text-[10px] uppercase tracking-widest font-bold">
                    © {new Date().getFullYear()} SUTEMA ISSEA. Todos los derechos reservados.
                </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Header (Only visible on small screens) */}
                    <div className="md:hidden flex flex-col items-center mb-10 text-center">
                        <div className="mb-2 flex items-center justify-center">
                            {/* Logo for Light Mode */}
                            <Image
                                src="/logo-color.png"
                                alt="Logo SUTEMA"
                                width={240}
                                height={80}
                                className="object-contain dark:hidden"
                                priority
                            />
                            {/* Logo for Dark Mode */}
                            <Image
                                src="/logo-blanco.png"
                                alt="Logo SUTEMA Blanco"
                                width={240}
                                height={80}
                                className="object-contain hidden dark:block"
                                priority
                            />
                        </div>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Gestión Sindical</p>
                    </div>

                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-black text-foreground tracking-tight">Iniciar Sesión</h2>
                        <p className="text-muted-foreground font-medium mt-2">Ingrese sus credenciales institucionales</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Usuario Institucional</Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@sutema.com"
                                    className="h-14 rounded-xl pl-12 border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground font-medium shadow-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contraseña</Label>
                                <button
                                    type="button"
                                    className="text-[10px] font-bold text-primary hover:text-primary-800 transition-colors uppercase tracking-wider"
                                    onClick={async () => {
                                        const emailReset = prompt("Ingrese su correo institucional para recibir el enlace de recuperación:")
                                        if (emailReset) {
                                            const { resetPassword } = await import('@/app/actions/users')
                                            const result = await resetPassword(emailReset)
                                            if (result.success) {
                                                toast.success("Enlace enviado. Revise su bandeja de entrada.")
                                            } else {
                                                toast.error(result.error || "Ocurrió un error")
                                            }
                                        }
                                    }}
                                >
                                    ¿Olvidó su contraseña?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-14 rounded-xl pl-12 border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground font-medium shadow-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 mt-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary-900 active:scale-[0.98] transition-all shadow-md"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Autenticando...
                                </>
                            ) : (
                                "Acceder al Sistema"
                            )}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
