'use client'

import React, { useState, useEffect } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { createUser, updateUser, UserSystem } from '@/app/actions/users'
import { Loader2 } from 'lucide-react'

interface UserDialogProps {
    user?: UserSystem | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export default function UserDialog({ user, open, onOpenChange, onSuccess }: UserDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        rol: 'capturista' as 'admin' | 'capturista',
        activo: true
    })

    useEffect(() => {
        if (user) {
            setFormData({
                nombre: user.nombre || '',
                email: user.usuario || '',
                rol: user.rol,
                activo: user.activo
            })
        } else {
            setFormData({
                nombre: '',
                email: '',
                rol: 'capturista',
                activo: true
            })
        }
    }, [user, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            let result
            if (user) {
                result = await updateUser(user.id, {
                    nombre_completo: formData.nombre,
                    rol: formData.rol,
                    activo: formData.activo
                })
            } else {
                result = await createUser({
                    email: formData.email,
                    nombre_completo: formData.nombre,
                    rol: formData.rol
                })
            }

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(user ? "Usuario actualizado" : "Usuario creado")
                onSuccess()
                onOpenChange(false)
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[2rem] border-border glass-card !bg-white dark:!bg-primary-950/90 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">{user ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
                    <DialogDescription>
                        {user ? 'Modifica los datos del usuario seleccionado.' : 'Ingresa los datos para el nuevo usuario. Se enviará un correo de bienvenida.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Nombre Completo</Label>
                        <Input
                            required
                            placeholder="Juan Pérez"
                            className="h-12 rounded-xl border-border bg-background focus-glow"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        />
                    </div>

                    {!user && (
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Correo Electrónico</Label>
                            <Input
                                required
                                type="email"
                                placeholder="juan@sutema.com"
                                className="h-12 rounded-xl border-border bg-background focus-glow"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Rol del Sistema</Label>
                            <Select value={formData.rol} onValueChange={(v: any) => setFormData({ ...formData, rol: v })}>
                                <SelectTrigger className="h-12 rounded-xl border-border bg-background focus-glow">
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="capturista">Capturista</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {user && (
                            <div className="space-y-2 flex flex-col justify-end">
                                <div className="flex items-center space-x-2 bg-muted/30 border border-border p-3 rounded-xl h-12">
                                    <Switch
                                        id="activo"
                                        checked={formData.activo}
                                        onCheckedChange={(v) => setFormData({ ...formData, activo: v })}
                                    />
                                    <Label htmlFor="activo" className="font-bold cursor-pointer">Activo</Label>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button type="submit" className="rounded-xl h-12 px-8 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {user ? 'Guardar Cambios' : 'Crear Usuario'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
