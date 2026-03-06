'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit2, Save, RotateCcw, Loader2, User, Briefcase, Home, CreditCard, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { getWorkerById, updateWorker, getAdscripciones } from '@/app/actions/workers'
import { toast } from 'sonner'

const MUNICIPIOS = [
    "Aguascalientes", "Asientos", "Calvillo", "Cosío", "Jesús María",
    "Pabellón de Arteaga", "Rincón de Romos", "San José de Gracia",
    "Tepezalá", "El Llano", "San Francisco de los Romo"
]

const ESTATUS_OPTIONS = ['activo', 'inactivo', 'baja', 'jubilado']

interface WorkerDetailPanelProps {
    workerId: string | null
    onClose: () => void
    onSaved: () => void
}

// A read-only field row
const ReadField = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground text-sm min-h-[20px]">{value || <span className="text-muted-foreground/50 italic text-xs">—</span>}</p>
    </div>
)

export default function WorkerDetailPanel({ workerId, onClose, onSaved }: WorkerDetailPanelProps) {
    const [worker, setWorker] = useState<any>(null)
    const [adscripciones, setAdscripciones] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [form, setForm] = useState<any>({})

    useEffect(() => {
        if (!workerId) { setWorker(null); return }
        setIsLoading(true)
        setIsEditing(false)
        Promise.all([getWorkerById(workerId), getAdscripciones()]).then(([w, ads]) => {
            setWorker(w)
            setForm(w ? { ...w, hijos_menores_12: w.hijos_menores_12 ? 1 : 0 } : {})
            setAdscripciones(ads)
            setIsLoading(false)
        })
    }, [workerId])

    const handleEdit = () => setIsEditing(true)

    const handleDiscard = () => {
        setForm(worker ? { ...worker, hijos_menores_12: worker.hijos_menores_12 ? 1 : 0 } : {})
        setIsEditing(false)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const payload = {
                ...form,
                fecha_ingreso: form.fecha_ingreso instanceof Date ? form.fecha_ingreso : new Date(form.fecha_ingreso),
                tiene_hijos: !!form.tiene_hijos,
                hijos_menores_12: form.tiene_hijos ? (form.hijos_menores_12 || 0) : 0,
            }
            const result = await updateWorker(workerId!, payload)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Trabajador actualizado')
                setIsEditing(false)
                setWorker(payload)
                onSaved()
            }
        } catch {
            toast.error('Error inesperado')
        } finally {
            setIsSaving(false)
        }
    }

    const setField = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }))

    const getEstatusBadge = (estatus: string) => {
        const map: Record<string, string> = {
            activo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            inactivo: 'bg-amber-50 text-amber-700 border-amber-200',
            baja: 'bg-red-50 text-red-700 border-red-200',
            jubilado: 'bg-blue-50 text-blue-700 border-blue-200',
        }
        return <Badge variant="outline" className={map[estatus] || ''}>{estatus.charAt(0).toUpperCase() + estatus.slice(1)}</Badge>
    }

    const Section = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
        <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
                <div className="p-1.5 rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                <h4 className="font-black text-sm uppercase tracking-wider">{title}</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">{children}</div>
        </div>
    )

    return (
        <AnimatePresence>
            {workerId && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />
                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l border-border shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
                            <div>
                                <h3 className="text-lg font-black tracking-tight">
                                    {isLoading ? 'Cargando...' : worker ? `${worker.nombre} ${worker.apellido_paterno}` : 'Registro'}
                                </h3>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                    {isEditing ? '✏️ Modo edición' : '👁️ Solo lectura'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {!isEditing && (
                                    <Button onClick={handleEdit} variant="outline" className="rounded-xl gap-2 h-9 font-bold">
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

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground font-medium">Cargando información...</p>
                                </div>
                            ) : worker ? (
                                <>
                                    {/* Estatus badge */}
                                    <div className="flex items-center gap-3">
                                        {isEditing ? (
                                            <Select value={form.estatus} onValueChange={v => setField('estatus', v)}>
                                                <SelectTrigger className="h-9 rounded-xl w-40"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {ESTATUS_OPTIONS.map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : getEstatusBadge(worker.estatus)}
                                        <span className="text-xs text-muted-foreground font-mono">{worker.curp}</span>
                                    </div>

                                    {/* Personal */}
                                    <Section icon={User} title="Información Personal">
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre(s)</Label>
                                            {isEditing
                                                ? <Input value={form.nombre || ''} onChange={e => setField('nombre', e.target.value)} className="h-9 rounded-xl mt-1" />
                                                : <p className="font-semibold text-sm mt-1">{worker.nombre}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">A. Paterno</Label>
                                            {isEditing
                                                ? <Input value={form.apellido_paterno || ''} onChange={e => setField('apellido_paterno', e.target.value)} className="h-9 rounded-xl mt-1" />
                                                : <p className="font-semibold text-sm mt-1">{worker.apellido_paterno}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">A. Materno</Label>
                                            {isEditing
                                                ? <Input value={form.apellido_materno || ''} onChange={e => setField('apellido_materno', e.target.value)} className="h-9 rounded-xl mt-1" />
                                                : <p className="font-semibold text-sm mt-1">{worker.apellido_materno || '—'}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sexo</Label>
                                            {isEditing
                                                ? <Select value={form.sexo} onValueChange={v => setField('sexo', v)}>
                                                    <SelectTrigger className="h-9 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                                        <SelectItem value="Femenino">Femenino</SelectItem>
                                                        <SelectItem value="Otro">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                : <p className="font-semibold text-sm mt-1">{worker.sexo || '—'}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado Civil</Label>
                                            {isEditing
                                                ? <Select value={form.estado_civil} onValueChange={v => setField('estado_civil', v)}>
                                                    <SelectTrigger className="h-9 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión Libre'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                : <p className="font-semibold text-sm mt-1">{worker.estado_civil || '—'}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Teléfono</Label>
                                            {isEditing
                                                ? <Input value={form.telefono || ''} onChange={e => setField('telefono', e.target.value)} className="h-9 rounded-xl mt-1" />
                                                : <p className="font-semibold text-sm mt-1">{worker.telefono || '—'}</p>}
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">F. Nacimiento</Label>
                                            {isEditing
                                                ? <Input type="date" value={form.fecha_nacimiento || ''} onChange={e => setField('fecha_nacimiento', e.target.value)} className="h-9 rounded-xl mt-1" />
                                                : <p className="font-semibold text-sm mt-1">{worker.fecha_nacimiento || '—'}</p>}
                                        </div>
                                    </Section>

                                    {/* Laboral */}
                                    <Section icon={Briefcase} title="Información Laboral">
                                        <div className="col-span-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adscripción</Label>
                                            {isEditing
                                                ? <Select value={String(form.adscripcion_id)} onValueChange={v => setField('adscripcion_id', v)}>
                                                    <SelectTrigger className="h-9 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {adscripciones.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.nombre}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                : <p className="font-semibold text-sm mt-1">{worker.adscripciones?.nombre || '—'}</p>}
                                        </div>
                                        <ReadField label="Fecha Ingreso" value={worker.fecha_ingreso} />
                                    </Section>

                                    {/* Dirección */}
                                    <Section icon={Home} title="Dirección">
                                        <div className="col-span-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calle</Label>
                                            {isEditing
                                                ? <Input value={form.calle || ''} onChange={e => setField('calle', e.target.value)} className="h-9 rounded-xl mt-1" />
                                                : <p className="font-semibold text-sm mt-1">{worker.calle || '—'}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Núm. Ext.</Label>
                                            {isEditing
                                                ? <Input value={form.numero_exterior || ''} onChange={e => setField('numero_exterior', e.target.value)} className="h-9 rounded-xl mt-1" />
                                                : <p className="font-semibold text-sm mt-1">{worker.numero_exterior || '—'}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Núm. Int.</Label>
                                            {isEditing
                                                ? <Input value={form.numero_interior || ''} onChange={e => setField('numero_interior', e.target.value)} className="h-9 rounded-xl mt-1" />
                                                : <p className="font-semibold text-sm mt-1">{worker.numero_interior || '—'}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Colonia</Label>
                                            {isEditing
                                                ? <Input value={form.colonia || ''} onChange={e => setField('colonia', e.target.value)} className="h-9 rounded-xl mt-1" />
                                                : <p className="font-semibold text-sm mt-1">{worker.colonia || '—'}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Municipio</Label>
                                            {isEditing
                                                ? <Select value={form.municipio} onValueChange={v => setField('municipio', v)}>
                                                    <SelectTrigger className="h-9 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {MUNICIPIOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                : <p className="font-semibold text-sm mt-1">{worker.municipio || '—'}</p>}
                                        </div>
                                    </Section>

                                    {/* Electoral + Familiar */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <Section icon={CreditCard} title="Electoral">
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sección INE</Label>
                                                {isEditing
                                                    ? <Input value={form.seccion_ine || ''} onChange={e => setField('seccion_ine', e.target.value)} className="h-9 rounded-xl mt-1" />
                                                    : <p className="font-semibold text-sm mt-1">{worker.seccion_ine || '—'}</p>}
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clave Elector</Label>
                                                {isEditing
                                                    ? <Input value={form.clave_elector || ''} onChange={e => setField('clave_elector', e.target.value)} className="h-9 rounded-xl mt-1 uppercase" />
                                                    : <p className="font-semibold text-sm mt-1 font-mono">{worker.clave_elector || '—'}</p>}
                                            </div>
                                        </Section>

                                        <Section icon={Users} title="Familiar">
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                                                    <Checkbox
                                                        id="tiene_hijos_panel"
                                                        checked={!!form.tiene_hijos}
                                                        onCheckedChange={v => setField('tiene_hijos', !!v)}
                                                        disabled={!isEditing}
                                                    />
                                                    <Label htmlFor="tiene_hijos_panel" className="font-bold text-sm cursor-pointer">¿Tiene hijos?</Label>
                                                </div>
                                                {form.tiene_hijos && (
                                                    <div className="mt-3">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hijos &lt;12 años</Label>
                                                        {isEditing
                                                            ? <Input type="number" min={0} value={form.hijos_menores_12 || 0} onChange={e => setField('hijos_menores_12', parseInt(e.target.value) || 0)} className="h-9 rounded-xl mt-1" />
                                                            : <p className="font-semibold text-sm mt-1">{worker.hijos_menores_12 || 0}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </Section>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
