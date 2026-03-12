'use client'

import React, { useState, useEffect, useRef } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getWorkers } from '@/app/actions/workers'
import { Worker } from '@/components/tables/WorkerTable'
import { generateComisionDocx } from '@/lib/utils/generateDocx'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Briefcase, Download, Search, FileSignature, Calendar as CalendarIcon } from 'lucide-react'
import { format, isSameMonth, isSameYear, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { getUsedDays, registerComision } from '@/app/actions/comisiones'

// Basic placeholders while DB loads
import { 
  getAutoridades, 
  createAutoridad, 
  deleteAutoridad 
} from '@/app/actions/autoridades'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { PlusCircle, Trash2, Settings2 } from 'lucide-react'
import { getAdscripciones } from '@/app/actions/workers'

interface Autoridad {
    id: string
    nombre: string
    cargo: string
    adscripcion_id?: any
    unidad_id?: any
    copias: string[]
}

export default function ComisionesPage() {
    // Form State
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Worker[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
    const searchRef = useRef<HTMLDivElement>(null)

    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [fechas, setFechas] = useState('')
    const [selectedAutoridad, setSelectedAutoridad] = useState('')
    const [ccsText, setCcsText] = useState('')
    
    const [copiaTrabajador, setCopiaTrabajador] = useState(true)
    const [copiaArchivo, setCopiaArchivo] = useState(true)

    const [isGenerating, setIsGenerating] = useState(false)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    
    const [dbAutoridades, setDbAutoridades] = useState<Autoridad[]>([])
    const [allAdscripciones, setAllAdscripciones] = useState<any[]>([])
    const [isAutoPopulating, setIsAutoPopulating] = useState(false)
    
    // New Authority Form
    const [isManagingAutoridades, setIsManagingAutoridades] = useState(false)
    const [newAuth, setNewAuth] = useState({
        nombre: '', cargo: '', adscripcion_id: '', copias: ''
    })

    const [usedDays, setUsedDays] = useState(0)
    const [requestedDays, setRequestedDays] = useState(0)

    // Initialization
    useEffect(() => {
        Promise.all([getAutoridades(), getAdscripciones()]).then(([auths, ads]) => {
            setDbAutoridades(auths as Autoridad[])
            setAllAdscripciones(ads as any[])
        })
    }, [])

    // Format dates to Spanish string automatically
    useEffect(() => {
        if (!dateRange?.from) {
            setFechas('')
            setRequestedDays(0)
            return
        }

        const from = dateRange.from
        const to = dateRange.to
        
        // Calculate days
        const days = to ? differenceInDays(to, from) + 1 : 1
        setRequestedDays(days)

        if (!to || from.getTime() === to.getTime()) {
            // Un solo día: "12 de marzo del 2026"
            const formatted = format(from, "dd 'de' MMMM 'del' yyyy", { locale: es })
            setFechas(formatted.toLowerCase())
        } else {
            // Rango de fechas
            let formatted = ""
            if (isSameMonth(from, to) && isSameYear(from, to)) {
                // "12 al 20 de marzo del 2026"
                formatted = `${format(from, "dd")} al ${format(to, "dd")} de ${format(to, "MMMM 'del' yyyy", { locale: es })}`
            } else if (isSameYear(from, to)) {
                // "30 de enero al 02 de febrero del 2026"
                formatted = `${format(from, "dd 'de' MMMM", { locale: es })} al ${format(to, "dd 'de' MMMM 'del' yyyy", { locale: es })}`
            } else {
                formatted = `${format(from, "dd 'de' MMMM 'del' yyyy", { locale: es })} al ${format(to, "dd 'de' MMMM 'del' yyyy", { locale: es })}`
            }
            setFechas(formatted.toLowerCase())
        }
    }, [dateRange])

    // Fetch used days when worker selected + AUTO-SELECT AUTHORITY
    useEffect(() => {
        if (selectedWorker) {
            getUsedDays(selectedWorker.id, new Date().getFullYear()).then(setUsedDays)
            
            // Automation Logic: Search for an authority matching the worker's adscripcion or unidad
            const match = dbAutoridades.find(a => 
                (a.unidad_id && String(a.unidad_id) === String(selectedWorker.unidad_id)) || 
                (a.adscripcion_id && String(a.adscripcion_id) === String(selectedWorker.adscripcion_id))
            )

            if (match) {
                setSelectedAutoridad(match.id)
                if (match.copias && match.copias.length > 0) {
                    setCcsText(match.copias.join('\n'))
                } else {
                    setCcsText('')
                }
                toast.info(`Autoridad detectada automáticamente: ${match.nombre}`)
            }
        } else {
            setUsedDays(0)
            setSelectedAutoridad('')
            setCcsText('')
        }
    }, [selectedWorker, dbAutoridades])

    // Search effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.trim().length > 2 && !selectedWorker) {
                setIsSearching(true)
                try {
                    const res = await getWorkers({ search: searchTerm, perPage: 5 })
                    setSearchResults(res.data as Worker[])
                    setShowResults(true)
                } catch (e) {
                    console.error("Error buscando:", e)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults([])
                setShowResults(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm, selectedWorker])

    // Click outside to close results
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [searchRef])

    const handleSelectWorker = (worker: Worker) => {
        setSelectedWorker(worker)
        setSearchTerm(`${worker.nombre} ${worker.apellido_paterno} ${worker.apellido_materno || ''}`.trim())
        setShowResults(false)
    }

    const clearWorker = () => {
        setSelectedWorker(null)
        setSearchTerm('')
    }

    const handleGenerate = async () => {
        if (!selectedWorker) {
            toast.error("Por favor, selecciona un trabajador.")
            return
        }
        if (!fechas || !dateRange?.from) {
            toast.error("Por favor, selecciona las fechas.")
            return
        }
        if (!selectedAutoridad) {
            toast.error("Por favor, selecciona a quién va dirigido.")
            return
        }

        // Validate Limit
        if (usedDays + requestedDays > 15) {
            toast.error(`Límite excedido. El trabajador ya usó ${usedDays} días y esta solicitud es por ${requestedDays} días. (Máx. 15 anuales)`)
            return
        }

        setIsGenerating(true)
        try {
            const autoridad = dbAutoridades.find(a => a.id === selectedAutoridad)
            if (!autoridad) throw new Error("Autoridad no encontrada")

            // Parse CCs
            let copias = ccsText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)
            if (copiaTrabajador) {
                copias.push(`C. ${selectedWorker.nombre} ${selectedWorker.apellido_paterno} ${selectedWorker.apellido_materno || ''}`.trim())
            }

            const hoyRaw = format(new Date(), "dd 'de' MMMM 'del' yyyy", { locale: es })
            // Capitalize first letter of month for document date: "Aguascalientes, Ags. a 04 de Febrero del 2026"
            const fechaDocumento = hoyRaw.replace(/de ([a-z])/g, (m, p1) => `de ${p1.toUpperCase()}`)

            const blob = await generateComisionDocx({
                trabajadorNombre: `C. ${selectedWorker.nombre} ${selectedWorker.apellido_paterno} ${selectedWorker.apellido_materno || ''}`.trim().toUpperCase(),
                fechaDocumento: fechaDocumento,
                fechasComision: fechas,
                dirigidoA: autoridad.nombre,
                cargoDirigidoA: autoridad.cargo,
                copias: copias,
                archivo: copiaArchivo,
                sexo: selectedWorker.sexo
            })

            // Register in DB
            const res = await registerComision({
                trabajador_id: selectedWorker.id,
                fecha_inicio: dateRange.from.toISOString(),
                fecha_fin: (dateRange.to || dateRange.from).toISOString(),
                dias_usados: requestedDays
            })

            if (res.error) {
                console.error("No se pudo guardar en DB:", res.error)
                // We still let them download the doc, but inform about DB error
                toast.warning("El documento se generó pero no se pudo registrar en la base de datos.")
            }

            // Save file
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `ComisionS_SUTEMA_${selectedWorker.curp}_${new Date().getTime()}.docx`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)

            toast.success("Oficio generado y registrado correctamente.")
            // Update used days local state
            setUsedDays(prev => prev + requestedDays)

        } catch (error) {
            console.error("Error generando doc:", error)
            toast.error("Hubo un error al generar el documento.")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <AppLayout title="Comisiones" subtitle="Generación de Oficios de Comisión Sindical">
            <div className="max-w-4xl mx-auto space-y-6">
                
                <div className="glass-card p-6 md:p-8 rounded-3xl border border-border">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                        <div className="bg-primary/10 p-4 rounded-2xl">
                            <Briefcase className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black">Licencia Sindical</h2>
                                    <p className="text-sm text-muted-foreground font-medium">Llene los datos a continuación para generar el documento oficial.</p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-xl border-dashed border-primary/30 hover:border-primary px-4 h-9 gap-2 text-xs font-bold transition-all"
                                    onClick={() => setIsManagingAutoridades(true)}
                                >
                                    <Settings2 className="h-3.5 w-3.5" />
                                    Gestionar Autoridades
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Columna Izquierda: Datos Principales */}
                        <div className="space-y-6">
                            
                            <div className="space-y-2 relative" ref={searchRef}>
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Trabajador</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Buscar por nombre o apellidos..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value)
                                            if (selectedWorker) setSelectedWorker(null)
                                        }}
                                        className="rounded-xl h-11 pr-10 border-border font-medium"
                                    />
                                    {isSearching ? (
                                        <div className="absolute right-3 top-3 h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Search className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Search Results Dropdown */}
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                                        {searchResults.map(w => (
                                            <div 
                                                key={w.id} 
                                                className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-0 transition-colors"
                                                onClick={() => handleSelectWorker(w)}
                                            >
                                                <p className="font-bold text-sm">{w.nombre} {w.apellido_paterno} {w.apellido_materno}</p>
                                                <div className="flex gap-2 mt-0.5">
                                                    <span className="text-[10px] text-muted-foreground font-mono">{w.curp}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">• {w.adscripciones?.nombre || 'Sin Ads.'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 flex flex-col">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Fecha(s) de la Comisión</Label>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`rounded-xl h-11 justify-start text-left font-medium border-border ${!dateRange && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                                                        {format(dateRange.to, "LLL dd, y", { locale: es })}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y", { locale: es })
                                                )
                                            ) : (
                                                <span>Seleccionar fechas</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl border-border" align="start">
                                        <div className="p-1">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={dateRange?.from}
                                                selected={dateRange}
                                                onSelect={setDateRange}
                                                numberOfMonths={2}
                                                locale={es}
                                            />
                                            <div className="p-3 border-t border-border flex justify-end">
                                                <Button 
                                                    size="sm" 
                                                    className="rounded-lg px-6 font-bold"
                                                    onClick={() => setIsCalendarOpen(false)}
                                                >
                                                    Aceptar
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                
                                {fechas && (
                                    <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border space-y-3">
                                        <div>
                                            <Label className="text-[9px] uppercase font-black tracking-tighter text-slate-500 mb-1 block">Texto sugerido para el oficio:</Label>
                                            <p className="text-sm font-bold italic text-primary">"...solicita del día {fechas}, con la finalidad..."</p>
                                        </div>
                                        
                                        <div className="pt-2 border-t border-border/50 flex justify-between items-end">
                                            <div>
                                                <p className="text-[9px] uppercase font-black text-slate-500">Días solicitados</p>
                                                <p className="text-xl font-black">{requestedDays} <span className="text-xs font-medium text-muted-foreground">días</span></p>
                                            </div>
                                            {selectedWorker && (
                                                <div className="text-right">
                                                    <p className="text-[9px] uppercase font-black text-slate-500">Disponibles (15 máx)</p>
                                                    <p className={`text-xl font-black ${usedDays + requestedDays > 15 ? 'text-destructive' : 'text-green-600'}`}>
                                                        {15 - usedDays} <span className="text-xs font-medium text-muted-foreground">días</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-2 px-1 text-center">
                                    {usedDays > 0 && <span>El trabajador ya ha utilizado <b>{usedDays}</b> días este año.</span>}
                                </p>
                            </div>

                        </div>


                        {/* Columna Derecha: Destinatario y Copias */}
                        <div className="space-y-6">
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">A quien va dirigido</Label>
                                <Select value={selectedAutoridad} onValueChange={setSelectedAutoridad}>
                                    <SelectTrigger className="h-11 rounded-xl border-border font-medium">
                                        <SelectValue placeholder="Seleccione la autoridad..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border">
                                        {dbAutoridades.length === 0 && (
                                            <div className="p-4 flex flex-col items-center gap-3">
                                                <p className="text-xs text-muted-foreground text-center font-medium">
                                                    No hay autoridades registradas para esta unidad/área.
                                                </p>
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="w-full text-[10px] font-black h-8 rounded-lg"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsManagingAutoridades(true);
                                                    }}
                                                >
                                                    DAR DE ALTA AHORA
                                                </Button>
                                            </div>
                                        )}
                                        {dbAutoridades.map(a => (
                                            <SelectItem key={a.id} value={a.id} className="py-2 cursor-pointer">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-bold text-sm">{a.nombre}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{a.cargo}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Management Dialog */}
                            <Dialog open={isManagingAutoridades} onOpenChange={setIsManagingAutoridades}>
                                <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                                    <DialogHeader className="p-6 bg-slate-50 border-b border-border">
                                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                                            <Settings2 className="h-5 w-5 text-primary" />
                                            Gestionar Autoridades
                                        </DialogTitle>
                                    </DialogHeader>
                                    
                                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                                        {/* New Authority Form */}
                                        <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-[10px] font-black uppercase">Nombre del Titular</Label>
                                                <Input 
                                                    placeholder="Ej. DR. JAIME REYNA CRUZ" 
                                                    value={newAuth.nombre}
                                                    onChange={e => setNewAuth({...newAuth, nombre: e.target.value})}
                                                    className="rounded-xl h-10 border-border bg-white"
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-[10px] font-black uppercase">Cargo</Label>
                                                <Input 
                                                    placeholder="Ej. DIRECTOR DEL HOSPITAL DE LA MUJER" 
                                                    value={newAuth.cargo}
                                                    onChange={e => setNewAuth({...newAuth, cargo: e.target.value})}
                                                    className="rounded-xl h-10 border-border bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-black uppercase">Vincular a Área</Label>
                                                <Select value={newAuth.adscripcion_id} onValueChange={v => setNewAuth({...newAuth, adscripcion_id: v})}>
                                                    <SelectTrigger className="h-10 rounded-xl bg-white"><SelectValue placeholder="Opcional..." /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="none">Sin vinculación</SelectItem>
                                                        {allAdscripciones.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-black uppercase">Copias p/Oficio (CCs)</Label>
                                                <Input 
                                                    placeholder="Separar por comas..." 
                                                    value={newAuth.copias}
                                                    onChange={e => setNewAuth({...newAuth, copias: e.target.value})}
                                                    className="rounded-xl h-10 border-border bg-white"
                                                />
                                            </div>
                                            <Button 
                                                className="col-span-2 rounded-xl h-11 font-bold mt-2 shadow-md"
                                                onClick={async () => {
                                                    if (!newAuth.nombre || !newAuth.cargo) {
                                                        toast.error("Nombre y cargo son requeridos")
                                                        return
                                                    }
                                                    const res = await createAutoridad({
                                                        ...newAuth,
                                                        adscripcion_id: newAuth.adscripcion_id === 'none' ? null : newAuth.adscripcion_id,
                                                        copias: newAuth.copias.split(',').map(s => s.trim()).filter(s => s.length > 0)
                                                    })
                                                    if (res.success) {
                                                        toast.success("Autoridad agregada")
                                                        setNewAuth({nombre: '', cargo: '', adscripcion_id: '', copias: ''})
                                                        const updated = await getAutoridades()
                                                        setDbAutoridades(updated as Autoridad[])
                                                    } else {
                                                        toast.error(res.error)
                                                    }
                                                }}
                                            >
                                                <PlusCircle className="h-4 w-4 mr-2" /> Agregar Autoridad
                                            </Button>
                                        </div>

                                        {/* List */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Autoridades Registradas</h4>
                                            {dbAutoridades.map(a => (
                                                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card group hover:border-primary/30 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-sm">{a.nombre}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase">{a.cargo}</p>
                                                        {a.adscripcion_id && (
                                                            <Badge variant="outline" className="mt-2 text-[8px] h-4 bg-primary/5 text-primary border-primary/20">
                                                                VINCULADO: {allAdscripciones.find(ads => ads.id === a.adscripcion_id)?.nombre || 'Area'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        onClick={async () => {
                                                            if (confirm("¿Eliminar esta autoridad?")) {
                                                                await deleteAutoridad(a.id)
                                                                const updated = await getAutoridades()
                                                                setDbAutoridades(updated as Autoridad[])
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <DialogFooter className="p-4 bg-slate-50 border-t border-border">
                                        <Button variant="outline" className="rounded-xl px-8" onClick={() => setIsManagingAutoridades(false)}>Cerrar</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Con Copia Para (C.c.p)</Label>
                                <textarea
                                    value={ccsText}
                                    onChange={(e) => setCcsText(e.target.value)}
                                    className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] font-medium"
                                    placeholder="Un destinatario por línea..."
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">Escribe un destinatario por línea. Serán listados abajo de la firma.</p>
                            </div>

                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                                <div className="flex items-center space-x-3">
                                    <Checkbox 
                                        id="cc-trabajador" 
                                        checked={copiaTrabajador} 
                                        onCheckedChange={(c) => setCopiaTrabajador(!!c)} 
                                        className="rounded border-primary/30 data-[state=checked]:bg-primary"
                                    />
                                    <Label htmlFor="cc-trabajador" className="font-bold cursor-pointer text-sm">Turnar copia al trabajador <span className="text-muted-foreground font-normal text-xs">(Automático)</span></Label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Checkbox 
                                        id="cc-archivo" 
                                        checked={copiaArchivo} 
                                        onCheckedChange={(c) => setCopiaArchivo(!!c)} 
                                        className="rounded border-primary/30 data-[state=checked]:bg-primary"
                                    />
                                    <Label htmlFor="cc-archivo" className="font-bold cursor-pointer text-sm">Añadir copia para ARCHIVO</Label>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border flex justify-end">
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !selectedWorker || !fechas || !selectedAutoridad}
                            className="h-12 px-8 rounded-xl font-black uppercase tracking-widest gap-3 shadow-lg hover:shadow-xl transition-all"
                        >
                            {isGenerating ? (
                                <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FileSignature className="h-5 w-5" />
                            )}
                            {isGenerating ? "Generando..." : "Generar Documento"}
                        </Button>
                    </div>

                </div>

            </div>
        </AppLayout>
    )
}
