'use client'

import React, { useState } from 'react'
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
        <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="w-full max-w-[420px] relative z-10"
            >
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                        <span className="text-white font-black text-2xl">S</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">SUTEMA</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2">Sistema de Gestión Sindical</p>
                </div>

                <Card className="rounded-[2.5rem] border-white/50 bg-white/70 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <CardHeader className="pt-10 px-8">
                        <CardTitle className="text-2xl font-black text-foreground">Iniciar Sesión</CardTitle>
                        <CardDescription className="font-medium text-muted-foreground">Ingresa tus credenciales para continuar</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pt-6">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Usuario / Email</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="usuario@sutema.com"
                                        className="h-14 rounded-2xl pl-11 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950 focus:ring-primary/20"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-14 rounded-2xl pl-11 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950 focus:ring-primary/20"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg hover:scale-[0.98] active:scale-95 transition-all shadow-lg shadow-primary/20"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    "Ingresar"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="px-8 pb-10 flex flex-col items-center">
                        <button
                            type="button"
                            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                            onClick={() => toast.info("Comuníquese con el administrador del sistema para restablecer su contraseña.")}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </CardFooter>
                </Card>

                <p className="text-center mt-10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    © 2024 SUTEMA ISSEA. Todos los derechos reservados.
                </p>
            </motion.div>
        </div>
    )
}
