'use client'

import React, { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Plus,
    UserCog,
    Trash2,
    ShieldCheck,
    Key,
    Search,
    UserPlus,
    Loader2,
    Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getUsers, deleteUser, resetPassword, UserSystem, updatePassword } from '@/app/actions/users'
import UserDialog from '@/components/dashboard/UserDialog'
import PasswordDialog from '@/components/dashboard/PasswordDialog'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function ConfigPageClient() {
    const [users, setUsers] = useState<UserSystem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserSystem | null>(null)
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
    const [confirmConfig, setConfirmConfig] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        variant: 'default' | 'destructive';
    }>({ open: false, title: '', description: '', onConfirm: () => { }, variant: 'default' })
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const [userToReset, setUserToReset] = useState<UserSystem | null>(null)
    const [myPassword, setMyPassword] = useState('')
    const [isUpdatingMyPass, setIsUpdatingMyPass] = useState(false)
    const [showMyPass, setShowMyPass] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const checkAdmin = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }
        setCurrentUser(user)

        const { data: profile } = await supabase
            .from('usuarios_sistema')
            .select('rol')
            .eq('id', user.id)
            .single()

        if (profile?.rol !== 'admin') {
            setIsAdmin(false)
            toast.error("Solo administradores pueden acceder a esta sección.")
            router.push('/dashboard')
        } else {
            setIsAdmin(true)
            fetchUsers()
        }
    }, [router, supabase])

    useEffect(() => {
        checkAdmin()
    }, [checkAdmin])

    const fetchUsers = async () => {
        setIsLoading(true)
        const data = await getUsers()
        setUsers(data)
        setIsLoading(false)
    }

    const handleDelete = (user: UserSystem) => {
        setConfirmConfig({
            open: true,
            title: `¿Eliminar a ${user.nombre}?`,
            description: "Esta acción no se puede deshacer y el usuario perderá el acceso al sistema de forma inmediata.",
            variant: 'destructive',
            onConfirm: async () => {
                setActionLoadingId(user.id)
                try {
                    const result = await deleteUser(user.id)
                    if (result.error) {
                        toast.error(result.error)
                    } else {
                        toast.success("Usuario eliminado")
                        fetchUsers()
                    }
                } finally {
                    setActionLoadingId(null)
                    setConfirmConfig(prev => ({ ...prev, open: false }))
                }
            }
        })
    }

    const handleReset = (user: UserSystem) => {
        if (!user.usuario) return
        setConfirmConfig({
            open: true,
            title: "Enviar Enlace de Recuperación",
            description: `Se enviará un enlace al correo ${user.usuario} para que el usuario asigne su propia contraseña.`,
            variant: 'default',
            onConfirm: async () => {
                setActionLoadingId(user.id)
                try {
                    const result = await resetPassword(user.usuario!)
                    if (result.error) {
                        toast.error(result.error)
                    } else {
                        toast.success(result.message || "Enlace enviado")
                    }
                } finally {
                    setActionLoadingId(null)
                    setConfirmConfig(prev => ({ ...prev, open: false }))
                }
            }
        })
    }

    const handleUpdateMyPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (myPassword.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres")
            return
        }
        setIsUpdatingMyPass(true)
        try {
            const result = await updatePassword(myPassword)
            if (result.error) toast.error(result.error)
            else {
                toast.success("Tu contraseña ha sido actualizada")
                setMyPassword('')
                setShowMyPass(false)
            }
        } finally {
            setIsUpdatingMyPass(false)
        }
    }

    const filteredUsers = users.filter(u =>
        u.nombre.toLowerCase().includes(search.toLowerCase())
    )

    if (isAdmin === null) return (
        <div className="h-screen w-full flex items-center justify-center">
            <Loader2 className="animate-spin h-10 w-10 text-muted-foreground/50" />
        </div>
    )

    return (
        <AppLayout title="Administración" subtitle="Gestión de Usuarios y Accesos">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar usuarios..."
                            className="pl-11 h-12 rounded-2xl border-border bg-background shadow-sm focus-glow"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => { setSelectedUser(null); setIsDialogOpen(true) }}
                        className="rounded-2xl h-12 px-6 gap-2 bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/10"
                    >
                        <UserPlus className="h-4 w-4" /> Nuevo Usuario
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* My Profile Section */}
                    <Card className="glass-card shadow-sm border-none rounded-[2.5rem] p-8 lg:col-span-1">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    <UserCog className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Mi Perfil</h3>
                                    <p className="text-sm text-muted-foreground">Configuración personal.</p>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1">Nombre</p>
                                    <p className="font-bold">{currentUser?.user_metadata?.full_name || 'Usuario'}</p>
                                </div>

                                <form onSubmit={handleUpdateMyPassword} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Cambiar mi Contraseña</Label>
                                        <div className="relative">
                                            <Input
                                                type={showMyPass ? "text" : "password"}
                                                placeholder="Nueva contraseña"
                                                className="h-12 rounded-xl border-border bg-background focus-glow pr-10"
                                                value={myPassword}
                                                onChange={(e) => setMyPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowMyPass(!showMyPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showMyPass ? <Lock className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={!myPassword || isUpdatingMyPass}
                                        className="w-full rounded-xl h-11 font-bold gap-2"
                                    >
                                        {isUpdatingMyPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                        Actualizar mi Contraseña
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </Card>

                    {/* Users List Section */}
                    <Card className="glass-card shadow-sm overflow-hidden border-none rounded-[2.5rem] lg:col-span-2">
                        <CardHeader className="pt-8 px-8 flex flex-row items-center gap-4 border-b border-border">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-xl font-bold">Usuarios Registrados</CardTitle>
                                <CardDescription>Gestión de roles y accesos al sistema sindical.</CardDescription>
                            </div>
                            <Badge variant="outline" className="rounded-full px-4 h-8 font-bold border-border text-[10px] tracking-widest uppercase">
                                {filteredUsers.length} TOTAL
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="px-8 font-bold py-6">Usuario</TableHead>
                                        <TableHead className="font-bold">Rol</TableHead>
                                        <TableHead className="font-bold">Estatus</TableHead>
                                        <TableHead className="px-8 text-right font-bold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center pt-10">
                                                <Loader2 className="animate-spin h-8 w-8 text-muted-foreground/30 mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center text-muted-foreground font-bold">No se encontraron usuarios</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user, i) => (
                                            <motion.tr
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                key={user.id}
                                                className="group border-border transition-colors hover:bg-muted/50"
                                            >
                                                <TableCell className="px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground">{user.nombre}</span>
                                                        <span className="text-xs text-muted-foreground">{user.usuario || '—'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`rounded-xl px-4 h-7 text-[10px] font-black tracking-wider uppercase ${user.rol === 'admin' ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800" : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800"
                                                        }`}>
                                                        {user.rol === 'admin' ? 'Administrador' : 'Capturista'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${user.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                        <span className="text-sm font-bold">{user.activo ? 'Activo' : 'Inactivo'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 text-right space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/10 text-amber-500"
                                                        title="Cambiar Contraseña Manualmente"
                                                        onClick={() => { setUserToReset(user); setPasswordDialogOpen(true) }}
                                                    >
                                                        <Lock className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-xl hover:bg-muted"
                                                        title="Enviar Enlace de Recuperación (Email)"
                                                        onClick={() => handleReset(user)}
                                                        disabled={actionLoadingId === user.id}
                                                    >
                                                        {actionLoadingId === user.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                        ) : (
                                                            <Key className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 border border-border rounded-xl hover:bg-muted"
                                                        onClick={() => { setSelectedUser(user); setIsDialogOpen(true) }}
                                                    >
                                                        <UserCog className="h-4 w-4 text-foreground/60" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                                                        onClick={() => handleDelete(user)}
                                                        disabled={actionLoadingId === user.id}
                                                    >
                                                        {actionLoadingId === user.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <UserDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    user={selectedUser}
                    onSuccess={fetchUsers}
                />

                <PasswordDialog
                    open={passwordDialogOpen}
                    onOpenChange={setPasswordDialogOpen}
                    user={userToReset}
                />

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50 p-6 rounded-[2rem] flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-bold text-amber-900 dark:text-amber-200">Nota sobre el Cambio Manual</p>
                        <p className="text-sm text-amber-800/70 dark:text-amber-400/70 mt-1">
                            El cambio manual de contraseña es instantáneo y no requiere confirmación por correo.
                            Asegúrate de haber configurado la clave de servicio en el servidor para que esta función esté activa.
                        </p>
                    </div>
                </div>

                {/* Confirm Action Dialog */}
                <Dialog open={confirmConfig.open} onOpenChange={(v) => setConfirmConfig(prev => ({ ...prev, open: v }))}>
                    <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">{confirmConfig.title}</DialogTitle>
                            <DialogDescription className="text-sm py-4">
                                {confirmConfig.description}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                className="rounded-xl h-12"
                                onClick={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
                                disabled={actionLoadingId !== null}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant={confirmConfig.variant === 'destructive' ? 'destructive' : 'default'}
                                className="rounded-xl h-12 px-6 gap-2"
                                onClick={confirmConfig.onConfirm}
                                disabled={actionLoadingId !== null}
                            >
                                {actionLoadingId !== null && <Loader2 className="h-4 w-4 animate-spin" />}
                                Confirmar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    )
}
