'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Edit2, Save, RotateCcw, Loader2,
    User, Briefcase, Home, CreditCard, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { getWorkerById, updateWorker, getAdscripciones } from '@/app/actions/workers'
import { toast } from 'sonner'

// ── Constants ──────────────────────────────────────────────────────────────
const MUNICIPIOS = [
    "Aguascalientes", "Asientos", "Calvillo", "Cosío", "Jesús María",
    "Pabellón de Arteaga", "Rincón de Romos", "San José de Gracia",
    "Tepezalá", "El Llano", "San Francisco de los Romo"
]
const ESTATUS_OPTIONS = ['activo', 'inactivo', 'baja', 'jubilado']
const SEXO_OPTIONS = ['Masculino', 'Femenino', 'Otro']
const ESTADO_CIVIL_OPTIONS = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión Libre']

// ── Small sub-components defined OUTSIDE the panel (avoids React re-mount issues)
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
    return (
        <div className="flex items-center gap-2 border-b border-border pb-1.5 col-span-2">
            <div className="p-1 rounded-lg bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" />
            </div>
            <h4 className="font-black text-sm uppercase tracking-wider">{title}</h4>
        </div>
    )
}

function ReadValue({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}>
                {value || <span className="text-muted-foreground/40 italic text-xs">—</span>}
            </p>
        </div>
    )
}

function FieldRow({
    label, isEditing, readValue, editNode
}: { label: string; isEditing: boolean; readValue?: string | null; editNode: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</Label>
            {isEditing
                ? editNode
                : <p className="text-sm font-semibold mt-1">{readValue || <span className="text-muted-foreground/40 italic text-xs">—</span>}</p>
            }
        </div>
    )
}

// ── Props ──────────────────────────────────────────────────────────────────
interface WorkerDetailPanelProps {
    workerId: string | null
    onClose: () => void
    onSaved: () => void
}

// ── Main component ─────────────────────────────────────────────────────────
export default function WorkerDetailPanel({ workerId, onClose, onSaved }: WorkerDetailPanelProps) {
    const [worker, setWorker] = useState<any>(null)
    const [adscripciones, setAdscripciones] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [form, setForm] = useState<Record<string, any>>({})

    useEffect(() => {
        if (!workerId) {
            setWorker(null)
            setForm({})
            setIsEditing(false)
            return
        }
        setIsLoading(true)
        setIsEditing(false)
        setWorker(null)

        Promise.all([getWorkerById(workerId), getAdscripciones()])
            .then(([w, ads]) => {
                setWorker(w ?? null)
                setForm(w ? { ...w } : {})
                setAdscripciones(ads ?? [])
            })
            .catch(() => {
                toast.error('Error al cargar el trabajador')
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [workerId])

    const setField = (key: string, value: any) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const handleDiscard = () => {
        setForm(worker ? { ...worker } : {})
        setIsEditing(false)
    }

    const handleSave = async () => {
        if (!workerId) return
        setIsSaving(true)
        try {
            const payload = {
                ...form,
                fecha_ingreso: form.fecha_ingreso instanceof Date
                    ? form.fecha_ingreso
                    : new Date(form.fecha_ingreso ?? Date.now()),
                tiene_hijos: !!form.tiene_hijos,
                hijos_menores_12: form.tiene_hijos ? !!form.hijos_menores_12 : false,
            }
            const result = await updateWorker(workerId, payload as any)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Trabajador actualizado')
                setIsEditing(false)
                setWorker(payload)
                onSaved()
            }
        } catch {
            toast.error('Error inesperado al guardar')
        } finally {
            setIsSaving(false)
        }
    }

    const getEstatusBadge = (estatus: string) => {
        const styles: Record<string, string> = {
            activo: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800',
            inactivo: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800',
            baja: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800',
            jubilado: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800',
        }
        const label = estatus.charAt(0).toUpperCase() + estatus.slice(1)
        return <Badge variant="outline" className={styles[estatus] ?? ''}>{label}</Badge>
    }

    return (
        <AnimatePresence>
            {workerId && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={onClose}
                />
            )}
            {workerId && (
                <motion.div
                    key="panel"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className="fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l border-border shadow-2xl z-50 flex flex-col"
                >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between p-5 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
                        <div>
                            <h3 className="text-base font-black tracking-tight">
                                {isLoading
                                    ? 'Cargando...'
                                    : worker
                                        ? `${worker.nombre} ${worker.apellido_paterno}`
                                        : 'Registro'}
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-medium">
                                {isEditing ? '✏️ Modo edición — cambios no guardados' : '👁️ Solo lectura'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {!isEditing && !isLoading && worker && (
                                <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-xl gap-2 h-9 font-bold">
                                    <Edit2 className="h-4 w-4" /> Editar
                                </Button>
                            )}
                            {isEditing && (
                                <>
                                    <Button onClick={handleDiscard} variant="outline" className="rounded-xl gap-2 h-9 font-bold text-muted-foreground" disabled={isSaving}>
                                        <RotateCcw className="h-4 w-4" /> Descartar
                                    </Button>
                                    <Button onClick={handleSave} className="rounded-xl gap-2 h-9 font-bold" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Guardar
                                    </Button>
                                </>
                            )}
                            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl h-9 w-9 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-60 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground font-medium">Cargando información...</p>
                            </div>
                        )}

                        {!isLoading && worker && (
                            <>
                                {/* Estatus + CURP */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    {isEditing ? (
                                        <Select value={form.estatus ?? ''} onValueChange={v => setField('estatus', v)}>
                                            <SelectTrigger className="h-8 rounded-lg w-32 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {ESTATUS_OPTIONS.map(e => (
                                                    <SelectItem key={e} value={e} className="text-xs">
                                                        {e.charAt(0).toUpperCase() + e.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        getEstatusBadge(worker.estatus)
                                    )}
                                    <span className="text-[10px] text-muted-foreground font-mono tracking-wider bg-muted/50 px-2 py-0.5 rounded-full">
                                        {worker.curp || '—'}
                                    </span>
                                </div>

                                {/* ── Personal ── */}
                                <div className="grid grid-cols-2 gap-4">
                                    <SectionHeader icon={User} title="Información Personal" />

                                    <FieldRow label="Nombre(s)" isEditing={isEditing} readValue={worker.nombre}
                                        editNode={<Input value={form.nombre ?? ''} onChange={e => setField('nombre', e.target.value)} className="h-9 rounded-xl mt-1" />}
                                    />
                                    <FieldRow label="A. Paterno" isEditing={isEditing} readValue={worker.apellido_paterno}
                                        editNode={<Input value={form.apellido_paterno ?? ''} onChange={e => setField('apellido_paterno', e.target.value)} className="h-9 rounded-xl mt-1" />}
                                    />
                                    <FieldRow label="A. Materno" isEditing={isEditing} readValue={worker.apellido_materno}
                                        editNode={<Input value={form.apellido_materno ?? ''} onChange={e => setField('apellido_materno', e.target.value)} className="h-9 rounded-xl mt-1" />}
                                    />
                                    <FieldRow label="Teléfono" isEditing={isEditing} readValue={worker.telefono}
                                        editNode={<Input value={form.telefono ?? ''} onChange={e => setField('telefono', e.target.value)} className="h-9 rounded-xl mt-1" />}
                                    />
                                    <FieldRow label="Sexo" isEditing={isEditing} readValue={worker.sexo}
                                        editNode={
                                            <Select value={form.sexo ?? ''} onValueChange={v => setField('sexo', v)}>
                                                <SelectTrigger className="h-9 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {SEXO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        }
                                    />
                                    <FieldRow label="Estado Civil" isEditing={isEditing} readValue={worker.estado_civil}
                                        editNode={
                                            <Select value={form.estado_civil ?? ''} onValueChange={v => setField('estado_civil', v)}>
                                                <SelectTrigger className="h-9 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {ESTADO_CIVIL_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        }
                                    />
                                    <div className="col-span-2">
                                        <FieldRow label="Fecha de Nacimiento" isEditing={isEditing} readValue={worker.fecha_nacimiento}
                                            editNode={<Input type="date" value={form.fecha_nacimiento ?? ''} onChange={e => setField('fecha_nacimiento', e.target.value)} className="h-9 rounded-xl mt-1" />}
                                        />
                                    </div>
                                </div>

                                {/* ── Laboral ── */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <SectionHeader icon={Briefcase} title="Información Laboral" />
                                    <div className="col-span-2">
                                        <FieldRow label="Adscripción" isEditing={isEditing} readValue={worker.adscripciones?.nombre}
                                            editNode={
                                                <Select value={String(form.adscripcion_id ?? '')} onValueChange={v => setField('adscripcion_id', v)}>
                                                    <SelectTrigger className="h-8 rounded-lg mt-1 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {adscripciones.map(a => (
                                                            <SelectItem key={a.id} value={String(a.id)} className="text-xs">{a.nombre}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            }
                                        />
                                    </div>
                                    <FieldRow
                                        label="Fecha Ingreso"
                                        isEditing={isEditing}
                                        readValue={worker.fecha_ingreso instanceof Date ? worker.fecha_ingreso.toLocaleDateString('es-MX') : worker.fecha_ingreso}
                                        editNode={
                                            <Input
                                                type="date"
                                                value={form.fecha_ingreso ? (form.fecha_ingreso instanceof Date ? form.fecha_ingreso.toISOString().split('T')[0] : form.fecha_ingreso) : ''}
                                                onChange={e => setField('fecha_ingreso', e.target.value)}
                                                className="h-8 rounded-lg mt-1 text-xs"
                                            />
                                        }
                                    />
                                    <ReadValue label="Estatus" value={worker.estatus?.charAt(0).toUpperCase() + worker.estatus?.slice(1)} />
                                </div>

                                {/* ── Dirección ── */}
                                <div className="grid grid-cols-2 gap-4">
                                    <SectionHeader icon={Home} title="Dirección" />
                                    <div className="col-span-2">
                                        <FieldRow label="Calle" isEditing={isEditing} readValue={worker.calle}
                                            editNode={<Input value={form.calle ?? ''} onChange={e => setField('calle', e.target.value)} className="h-9 rounded-xl mt-1" />}
                                        />
                                    </div>
                                    <FieldRow label="Núm. Ext." isEditing={isEditing} readValue={worker.numero_exterior}
                                        editNode={<Input value={form.numero_exterior ?? ''} onChange={e => setField('numero_exterior', e.target.value)} className="h-9 rounded-xl mt-1" />}
                                    />
                                    <FieldRow label="Núm. Int." isEditing={isEditing} readValue={worker.numero_interior}
                                        editNode={<Input value={form.numero_interior ?? ''} onChange={e => setField('numero_interior', e.target.value)} className="h-9 rounded-xl mt-1" />}
                                    />
                                    <FieldRow label="Colonia" isEditing={isEditing} readValue={worker.colonia}
                                        editNode={<Input value={form.colonia ?? ''} onChange={e => setField('colonia', e.target.value)} className="h-9 rounded-xl mt-1" />}
                                    />
                                    <FieldRow label="Municipio" isEditing={isEditing} readValue={worker.municipio}
                                        editNode={
                                            <Select value={form.municipio ?? ''} onValueChange={v => setField('municipio', v)}>
                                                <SelectTrigger className="h-9 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {MUNICIPIOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        }
                                    />
                                </div>

                                {/* ── Electoral + Familiar ── */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Electoral */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center gap-2 border-b border-border pb-2">
                                            <div className="p-1.5 rounded-xl bg-primary/10 text-primary"><CreditCard className="h-4 w-4" /></div>
                                            <h4 className="font-black text-sm uppercase tracking-wider">Electoral</h4>
                                        </div>
                                        <FieldRow label="Sección INE" isEditing={isEditing} readValue={worker.seccion_ine}
                                            editNode={<Input value={form.seccion_ine ?? ''} onChange={e => setField('seccion_ine', e.target.value)} className="h-9 rounded-xl mt-1" />}
                                        />
                                        <FieldRow label="Clave Elector" isEditing={isEditing} readValue={worker.clave_elector}
                                            editNode={<Input value={form.clave_elector ?? ''} onChange={e => setField('clave_elector', e.target.value)} className="h-9 rounded-xl mt-1 uppercase font-mono" />}
                                        />
                                    </div>

                                    {/* Familiar */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center gap-2 border-b border-border pb-2">
                                            <div className="p-1.5 rounded-xl bg-primary/10 text-primary"><Users className="h-4 w-4" /></div>
                                            <h4 className="font-black text-sm uppercase tracking-wider">Familiar</h4>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                                            <Checkbox
                                                id="detail_tiene_hijos"
                                                checked={!!form.tiene_hijos}
                                                onCheckedChange={v => setField('tiene_hijos', !!v)}
                                                disabled={!isEditing}
                                            />
                                            <Label htmlFor="detail_tiene_hijos" className="font-semibold text-sm cursor-pointer">
                                                ¿Tiene hijos?
                                            </Label>
                                        </div>
                                        {form.tiene_hijos && (
                                            <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                                                <Checkbox
                                                    id="detail_hijos_12"
                                                    checked={!!form.hijos_menores_12}
                                                    onCheckedChange={v => setField('hijos_menores_12', !!v)}
                                                    disabled={!isEditing}
                                                />
                                                <Label htmlFor="detail_hijos_12" className="font-semibold text-sm cursor-pointer leading-tight">
                                                    ¿Hijos menores de 12 años?
                                                </Label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {!isLoading && !worker && (
                            <div className="flex flex-col items-center justify-center h-60 gap-3 text-muted-foreground">
                                <p className="font-bold">No se encontró el registro</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
