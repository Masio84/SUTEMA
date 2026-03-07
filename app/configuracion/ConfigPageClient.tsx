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
import { getUsers, deleteUser, resetPassword, UserSystem, updatePassword, updateProfileName, getActivityLogs, logActivity } from '@/app/actions/users'
import UserDialog from '@/components/dashboard/UserDialog'
import PasswordDialog from '@/components/dashboard/PasswordDialog'
import { Pencil, Check, X as CloseIcon, History, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
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
    const [passwordDialogIsSelf, setPasswordDialogIsSelf] = useState(false)
    const [userToReset, setUserToReset] = useState<UserSystem | null>(null)
    const [isEditingName, setIsEditingName] = useState(false)
    const [newName, setNewName] = useState('')
    const [isSavingName, setIsSavingName] = useState(false)
    const [activityLogs, setActivityLogs] = useState<any[]>([])
    const [isLoadingLogs, setIsLoadingLogs] = useState(true)
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

    const fetchLogs = useCallback(async () => {
        setIsLoadingLogs(true)
        const logs = await getActivityLogs()
        setActivityLogs(logs)
        setIsLoadingLogs(false)
    }, [])

    useEffect(() => {
        if (isAdmin) fetchLogs()
    }, [isAdmin, fetchLogs])

    const handleUpdateName = async () => {
        if (!newName.trim() || newName === currentUser?.user_metadata?.full_name) {
            setIsEditingName(false)
            return
        }
        setIsSavingName(true)
        const res = await updateProfileName(newName)
        if (res.success) {
            toast.success("Nombre de perfil actualizado")
            await logActivity("Cambio de Nombre", `El usuario actualizó su nombre a: ${newName}`)
            router.refresh()
            setIsEditingName(false)
        } else {
            toast.error(res.error || "Error al actualizar")
        }
        setIsSavingName(false)
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
                            className="pl-11 h-10 rounded-xl border-border bg-background shadow-sm focus-glow text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => { setSelectedUser(null); setIsDialogOpen(true) }}
                        className="rounded-xl h-10 px-5 gap-2 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/10"
                    >
                        <UserPlus className="h-4 w-4" /> Nuevo Usuario
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* My Profile Section */}
                    <Card className="glass-card shadow-sm border-none rounded-2xl p-6 lg:col-span-1">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    <UserCog className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Mi Perfil</h3>
                                    <p className="text-xs text-muted-foreground">Datos personales y actividad.</p>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="p-5 rounded-[1.5rem] bg-muted/30 border border-border group relative">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 flex items-center gap-2">
                                        Nombre de Usuario
                                        {!isEditingName && (
                                            <button
                                                onClick={() => { setIsEditingName(true); setNewName(currentUser?.user_metadata?.full_name || '') }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-md text-primary"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </button>
                                        )}
                                    </p>

                                    {isEditingName ? (
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                autoFocus
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="h-10 rounded-xl bg-background border-primary/20"
                                            />
                                            <Button
                                                size="icon"
                                                disabled={isSavingName}
                                                onClick={handleUpdateName}
                                                className="h-9 w-9 shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                                            >
                                                {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setIsEditingName(false)}
                                                className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground"
                                            >
                                                <CloseIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="font-bold text-lg">{currentUser?.user_metadata?.full_name || 'Usuario'}</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actividad Reciente</p>
                                        <History className="h-3 w-3 text-muted-foreground" />
                                    </div>

                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {isLoadingLogs ? (
                                            <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground/30" /></div>
                                        ) : activityLogs.length === 0 ? (
                                            <p className="text-[11px] text-muted-foreground text-center py-4 italic">No hay historial disponible.</p>
                                        ) : (
                                            activityLogs.map((log, lIdx) => (
                                                <div key={log.id || lIdx} className="bg-background/50 border border-border/50 p-3 rounded-2xl space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[11px] font-bold text-primary leading-tight">{log.accion}</span>
                                                        <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-medium bg-muted/50 px-2 py-0.5 rounded-full shrink-0">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {log.fecha ? format(new Date(log.fecha), 'HH:mm', { locale: es }) : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{log.detalles}</p>
                                                    <p className="text-[9px] text-muted-foreground/60 font-medium">
                                                        {log.fecha ? format(new Date(log.fecha), 'dd MMM yyyy', { locale: es }) : ''}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={() => {
                                            setUserToReset({
                                                id: currentUser.id,
                                                nombre: currentUser.user_metadata?.full_name || 'Mi Cuenta',
                                                rol: 'admin',
                                                activo: true
                                            } as UserSystem)
                                            setPasswordDialogIsSelf(true)
                                            setPasswordDialogOpen(true)
                                        }}
                                        variant="outline"
                                        className="w-full rounded-2xl h-11 font-bold gap-3 border-2 hover:bg-primary hover:text-primary-foreground transition-all group"
                                    >
                                        <Lock className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                                        Cambiar mi Contraseña
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Users List Section */}
                    <Card className="glass-card shadow-sm overflow-hidden border-none rounded-2xl lg:col-span-2">
                        <CardHeader className="pt-6 px-6 flex flex-row items-center gap-4 border-b border-border">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg font-bold">Usuarios Registrados</CardTitle>
                                <CardDescription className="text-xs">Gestión de roles y accesos.</CardDescription>
                            </div>
                            <Badge variant="outline" className="rounded-full px-3 h-7 font-bold border-border text-[9px] tracking-widest uppercase">
                                {filteredUsers.length} TOTAL
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="px-6 font-black uppercase text-[9px] tracking-widest text-muted-foreground py-4">Usuario</TableHead>
                                        <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Rol</TableHead>
                                        <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Estatus</TableHead>
                                        <TableHead className="px-6 text-right font-black uppercase text-[9px] tracking-widest text-muted-foreground">Acciones</TableHead>
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
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-foreground leading-tight">{user.nombre}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{user.usuario || '—'}</span>
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
                                                <TableCell className="px-6 text-right space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 text-amber-500"
                                                        title="Cambiar Contraseña Manualmente"
                                                        onClick={() => {
                                                            setUserToReset(user);
                                                            setPasswordDialogIsSelf(false);
                                                            setPasswordDialogOpen(true);
                                                        }}
                                                    >
                                                        <Lock className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg hover:bg-muted"
                                                        title="Enviar Enlace de Recuperación (Email)"
                                                        onClick={() => handleReset(user)}
                                                        disabled={actionLoadingId === user.id}
                                                    >
                                                        {actionLoadingId === user.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                                        ) : (
                                                            <Key className="h-3.5 w-3.5 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 border border-border rounded-lg hover:bg-muted"
                                                        onClick={() => { setSelectedUser(user); setIsDialogOpen(true) }}
                                                    >
                                                        <UserCog className="h-3.5 w-3.5 text-foreground/60" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                                                        onClick={() => handleDelete(user)}
                                                        disabled={actionLoadingId === user.id}
                                                    >
                                                        {actionLoadingId === user.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-3.5 w-3.5" />
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
                    isSelf={passwordDialogIsSelf}
                />

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50 p-5 rounded-2xl flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
                        <Lock className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-bold text-xs text-amber-900 dark:text-amber-200">Nota sobre el Cambio Manual</p>
                        <p className="text-[11px] text-amber-800/70 dark:text-amber-400/70 mt-0.5">
                            El cambio manual de contraseña es instantáneo y no requiere confirmación por correo.
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
