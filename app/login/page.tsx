'use client'

import { useState } from 'react'
import { login } from '../actions/auth'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { Lock, User, Info } from 'lucide-react'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const result = await login(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 font-sans ring-zinc-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                {/* Logo / Title */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 drop-shadow-sm">
                        SUTEMA
                    </h1>
                    <p className="mt-2 text-zinc-500 dark:text-zinc-400">Sistema de Gestión de Trabajadores</p>
                </div>

                <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden glass-morphism">
                    <CardHeader className="space-y-1 pb-8 pt-8">
                        <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
                        <CardDescription className="text-center text-zinc-500">
                            Ingresa tus credenciales para acceder al sistema
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {error && (
                                <div className="p-3 text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900 animate-in fade-in zoom-in duration-200">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2 group">
                                <Label htmlFor="usuario" className="text-sm font-semibold transition-colors group-focus-within:text-foreground">Usuario</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                    <Input
                                        id="usuario"
                                        name="usuario"
                                        placeholder="correo@ejemplo.com"
                                        required
                                        className="pl-10 h-11 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <Label htmlFor="password" title="Contraseña" className="text-sm font-semibold transition-colors group-focus-within:text-foreground">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="pl-10 h-11 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-900">
                                <div className="flex items-start gap-3">
                                    <Info className="h-4 w-4 mt-0.5 text-zinc-500 shrink-0" />
                                    <p className="leading-relaxed">
                                        ¿Olvidó su contraseña? <br />
                                        <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                                            Comuníquese con el administrador del sistema para restablecer su contraseña.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pb-8 pt-2">
                            <Button type="submit" disabled={loading} className="w-full h-11 text-base font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20">
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                        Accediendo...
                                    </div>
                                ) : (
                                    'Entrar al sistema'
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <p className="mt-8 text-center text-xs text-zinc-400 uppercase tracking-widest font-medium">
                    © {new Date().getFullYear()} SUTEMA - ISSEA
                </p>
            </motion.div>
        </div>
    )
}
