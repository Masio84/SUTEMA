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
import { toast } from 'sonner'
import { getUsers, deleteUser, resetPassword, UserSystem } from '@/app/actions/users'
import UserDialog from '@/components/dashboard/UserDialog'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ConfigPageClient() {
    const [users, setUsers] = useState<UserSystem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserSystem | null>(null)
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const supabase = createClient()
    const router = useRouter()

    const checkAdmin = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

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

    const handleDelete = async (user: UserSystem) => {
        if (confirm(`¿Está seguro de eliminar a ${user.nombre_completo}?`)) {
            const result = await deleteUser(user.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Usuario eliminado")
                fetchUsers()
            }
        }
    }

    const handleReset = async (email: string) => {
        if (confirm("Se enviará un enlace de recuperación al correo. ¿Continuar?")) {
            const result = await resetPassword(email)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.message)
            }
        }
    }

    const filteredUsers = users.filter(u =>
        u.nombre_completo.toLowerCase().includes(search.toLowerCase())
    )

    if (isAdmin === null) return (
        <div className="h-screen w-full flex items-center justify-center">
            <Loader2 className="animate-spin h-10 w-10 text-zinc-400" />
        </div>
    )

    return (
        <AppLayout title="Administración" subtitle="Gestión de Usuarios y Accesos">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Buscar usuarios..."
                            className="pl-11 h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => { setSelectedUser(null); setIsDialogOpen(true) }}
                        className="rounded-2xl h-12 px-6 gap-2 bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 font-bold border-zinc-200 shadow-xl shadow-zinc-200 dark:shadow-none"
                    >
                        <UserPlus className="h-4 w-4" /> Nuevo Usuario
                    </Button>
                </div>

                <Card className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                    <CardHeader className="pt-8 px-8 flex flex-row items-center gap-4 border-b border-zinc-50 dark:border-zinc-900">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-xl font-bold">Usuarios Registrados</CardTitle>
                            <CardDescription>Gestión de roles y accesos al sistema sindical.</CardDescription>
                        </div>
                        <Badge variant="outline" className="rounded-full px-4 h-8 font-bold border-zinc-200 text-[10px] tracking-widest uppercase">
                            {filteredUsers.length} TOTAL
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-zinc-50 dark:border-zinc-900">
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
                                            <Loader2 className="animate-spin h-8 w-8 text-zinc-200 mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center text-zinc-500 font-bold">No se encontraron usuarios</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user, i) => (
                                        <motion.tr
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            key={user.id}
                                            className="group border-zinc-50 dark:border-zinc-900 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                                        >
                                            <TableCell className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{user.nombre_completo}</span>
                                                    <span className="text-xs text-zinc-500">{user.email || '—'}</span>
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
                                                    className="h-10 w-10 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                                    title="Restablecer Contraseña"
                                                    onClick={() => user.email && handleReset(user.email)}
                                                >
                                                    <Lock className="h-4 w-4 text-zinc-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 border border-zinc-100 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                                    onClick={() => { setSelectedUser(user); setIsDialogOpen(true) }}
                                                >
                                                    <UserCog className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-500 text-zinc-400"
                                                    onClick={() => handleDelete(user)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Instructions Alert */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-6 rounded-[2rem] flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
                        <Key className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-bold text-amber-900 dark:text-amber-200">Sobre la Gestión de Usuarios</p>
                        <p className="text-sm text-amber-800 dark:text-amber-400 mt-1">
                            La creación de nuevos usuarios requiere el envío de una invitación por correo. Los usuarios creados tendrán una contraseña temporal por defecto. Se recomienda que los capturistas cambien su contraseña en su primer inicio de sesión.
                        </p>
                    </div>
                </div>

                <UserDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    user={selectedUser}
                    onSuccess={fetchUsers}
                />
            </div>
        </AppLayout>
    )
}
