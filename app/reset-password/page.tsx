'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { updatePassword } from '@/app/actions/users'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden")
            return
        }

        setIsLoading(true)

        try {
            const result = await updatePassword(password)
            if (result.error) {
                toast.error(result.error)
            } else {
                setIsSuccess(true)
                toast.success("Contraseña actualizada con éxito")
                setTimeout(() => router.push('/login'), 3000)
            }
        } catch (error) {
            toast.error("Error al restablecer la contraseña")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-10 text-center">
                    <Image
                        src="/logo-color.png"
                        alt="Logo SUTEMA"
                        width={240}
                        height={80}
                        className="object-contain"
                        priority
                    />
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-2">Gestión de Seguridad</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl overflow-hidden glass-card">
                        <CardHeader className="pt-10 pb-2 text-center">
                            <CardTitle className="text-2xl font-black">Restablecer Contraseña</CardTitle>
                            <CardDescription className="text-zinc-500 font-medium pt-1">
                                {isSuccess
                                    ? "¡Tu acceso ha sido actualizado!"
                                    : "Ingresa tu nueva contraseña para acceder al sistema."}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-8">
                            <AnimatePresence mode="wait">
                                {isSuccess ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col items-center py-6 text-center"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                        </div>
                                        <p className="text-zinc-600 font-medium">Serás redirigido al inicio de sesión en unos segundos...</p>
                                        <Button
                                            variant="outline"
                                            className="mt-6 rounded-xl font-bold"
                                            onClick={() => router.push('/login')}
                                        >
                                            Ir al Login ahora
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onSubmit={handleReset}
                                        className="space-y-5"
                                    >
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Nueva Contraseña</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="h-12 rounded-xl pl-12 border-zinc-200 bg-white"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Confirmar Contraseña</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="h-12 rounded-xl pl-12 border-zinc-200 bg-white"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-12 mt-4 rounded-xl font-bold shadow-lg shadow-primary/20"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                "Actualizar Contraseña"
                                            )}
                                        </Button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
