'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { adminUpdatePassword, UserSystem } from '@/app/actions/users'
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react'

interface PasswordDialogProps {
    user: UserSystem | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function PasswordDialog({ user, open, onOpenChange }: PasswordDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres")
            return
        }

        setIsLoading(true)

        try {
            const result = await adminUpdatePassword(user.id, password)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Contraseña actualizada para ${user.nombre}`)
                setPassword('')
                onOpenChange(false)
            }
        } catch (error) {
            toast.error("Error al actualizar la contraseña")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[2.5rem] border-border glass-card !bg-white dark:!bg-primary-950/90 max-w-md p-8">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-4">
                        <Lock className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-2xl font-black">Cambiar Contraseña</DialogTitle>
                    <DialogDescription className="font-medium">
                        Asigna una nueva contraseña directamente para <span className="text-foreground font-bold">{user?.nombre}</span>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Nueva Contraseña</Label>
                        <div className="relative">
                            <Input
                                required
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="h-14 rounded-2xl border-border bg-background focus-glow pr-12 font-mono"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium px-1">
                            Mínimo 6 caracteres. El cambio es instantáneo.
                        </p>
                    </div>

                    <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-2xl h-12 font-bold order-2 sm:order-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="rounded-2xl h-12 px-8 font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 order-1 sm:order-2 flex-1"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Actualizar Contraseña"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
