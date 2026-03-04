"use client"

import React, { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    User,
    Briefcase,
    Home,
    Users,
    CreditCard,
    CalendarIcon,
    Save,
    AlertCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { workerSchema, WorkerFormValues } from "@/lib/validations/worker"

interface WorkerFormProps {
    initialData?: Partial<WorkerFormValues>
    onSubmit: (data: WorkerFormValues) => void
    isLoading?: boolean
}

const ADSCRIPCIONES = [
    "Oficinas Centrales",
    "Distrito Sanitario 1",
    "Distrito Sanitario 2",
    "Distrito Sanitario 3",
    "Hospital General Tercer Milenio",
    "Hospital de la Mujer",
    "LESP",
    "CETS",
    "VIH",
    "UNEME",
    "SEEM",
    "Hospital General de Rincón de Romo",
    "Hospital General de Pabellón de Arteaga",
    "Hospital General de Calvillo",
]

const MUNICIPIOS = [
    "Aguascalientes", "Asientos", "Calvillo", "Cosío", "Jesús María",
    "Pabellón de Arteaga", "Rincón de Romos", "San José de Gracia",
    "Tepezalá", "El Llano", "San Francisco de los Romo"
]

const UNIDADES_MOCK = {
    "Oficinas Centrales": ["Recursos Humanos", "Finanzas", "Sindicato", "Dirección General"],
    "Distritos": ["Subunidad A", "Subunidad B", "Clínica Local"]
}

export default function WorkerForm({ initialData, onSubmit, isLoading }: WorkerFormProps) {
    const form = useForm<WorkerFormValues>({
        resolver: zodResolver(workerSchema) as any,
        defaultValues: {
            nombre: "",
            apellido_paterno: "",
            apellido_materno: "",
            curp: "",
            sexo: "Masculino",
            estado_civil: "Soltero/a",
            telefono: "",
            adscripcion_id: "",
            unidad_id: "",
            fecha_ingreso: new Date(),
            estatus: "Activo",
            tiene_hijos: false,
            hijos_menores_12: 0,
            calle: "",
            numero_exterior: "",
            numero_interior: "",
            colonia: "",
            municipio: "Aguascalientes",
            seccion_ine: "",
            clave_elector: "",
            ...initialData,
        },
    })

    // Watch adscripcion to enable/disable unidad dropdown
    const selectedAdscripcion = form.watch("adscripcion_id")
    const isUnidadEnabled = selectedAdscripcion === "Oficinas Centrales" ||
        (selectedAdscripcion && selectedAdscripcion.includes("Distrito Sanitario"))

    // Get units for the selected adscripcion
    const getUnidades = () => {
        if (selectedAdscripcion === "Oficinas Centrales") return UNIDADES_MOCK["Oficinas Centrales"]
        if (selectedAdscripcion && selectedAdscripcion.includes("Distrito Sanitario")) return UNIDADES_MOCK["Distritos"]
        return []
    }

    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12 pb-24 max-w-5xl mx-auto">

                {/* Section: Información Personal */}
                <motion.div variants={sectionVariants} initial="hidden" animate="visible">
                    <Card className="border-none shadow-none bg-transparent">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <User className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight">Información Personal</h3>
                        </div>
                        <CardContent className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shadow-sm">
                            <FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre (s)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="apellido_paterno"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Apellido Paterno</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Apellido Paterno" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="apellido_materno"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Apellido Materno</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Apellido Materno" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="curp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CURP</FormLabel>
                                        <FormControl>
                                            <Input maxLength={18} className="uppercase tracking-widest font-mono" placeholder="ABC123456XYZ" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sexo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sexo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Masculino">Masculino</SelectItem>
                                                <SelectItem value="Femenino">Femenino</SelectItem>
                                                <SelectItem value="Otro">Otro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="estado_civil"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado Civil</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Soltero/a">Soltero/a</SelectItem>
                                                <SelectItem value="Casado/a">Casado/a</SelectItem>
                                                <SelectItem value="Divorciado/a">Divorciado/a</SelectItem>
                                                <SelectItem value="Viudo/a">Viudo/a</SelectItem>
                                                <SelectItem value="Unión Libre">Unión Libre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Section: Información Laboral */}
                <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
                    <Card className="border-none shadow-none bg-transparent">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Briefcase className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight">Información Laboral</h3>
                        </div>
                        <CardContent className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
                            <FormField
                                control={form.control}
                                name="adscripcion_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adscripción</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar adscripción" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ADSCRIPCIONES.map(ads => (
                                                    <SelectItem key={ads} value={ads}>{ads}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unidad_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={cn(!isUnidadEnabled && "opacity-50")}>Dirección/Unidad</FormLabel>
                                        <Select
                                            disabled={!isUnidadEnabled}
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isUnidadEnabled ? "Seleccionar unidad" : "No requiere unidad"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {getUnidades().map(un => (
                                                    <SelectItem key={un} value={un}>{un}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fecha_ingreso"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="mb-0.5">Fecha de Ingreso</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal h-10",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: es })
                                                        ) : (
                                                            <span>Seleccionar fecha</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="estatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estatus</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Estado actual" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Activo">Activo</SelectItem>
                                                <SelectItem value="Inactivo">Inactivo</SelectItem>
                                                <SelectItem value="Baja">Baja</SelectItem>
                                                <SelectItem value="Jubilado">Jubilado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Section: Dirección */}
                <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                    <Card className="border-none shadow-none bg-transparent">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Home className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight">Dirección</h3>
                        </div>
                        <CardContent className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="calle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Calle</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Av. Principal" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="numero_exterior"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>No. Ext</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="numero_interior"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>No. Int</FormLabel>
                                            <FormControl>
                                                <Input placeholder="B" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="colonia"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Colonia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Fraccionamiento..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="municipio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Municipio</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {MUNICIPIOS.map(m => (
                                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder="4490000000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Section: Información Familiar & Electorales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Familiar */}
                    <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
                        <Card className="border-none shadow-none bg-transparent">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <Users className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight">Información Familiar</h3>
                            </div>
                            <CardContent className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm min-h-[160px]">
                                <FormField
                                    control={form.control}
                                    name="tiene_hijos"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>¿Tiene hijos?</FormLabel>
                                                <FormDescription>Marcar si el trabajador tiene hijos dependientes.</FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <AnimatePresence>
                                    {form.watch("tiene_hijos") && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                        >
                                            <FormField
                                                control={form.control}
                                                name="hijos_menores_12"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>No. Hijos menores de 12 años</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Electorales */}
                    <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
                        <Card className="border-none shadow-none bg-transparent">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight">Datos Electorales</h3>
                            </div>
                            <CardContent className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 gap-6 shadow-sm min-h-[160px]">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="seccion_ine"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sección INE</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="0000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="clave_elector"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Clave Elector</FormLabel>
                                                <FormControl>
                                                    <Input className="uppercase" placeholder="ABCD5678..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Floating Actions */}
                <div className="fixed bottom-8 right-8 z-50">
                    <Button
                        size="lg"
                        type="submit"
                        disabled={isLoading}
                        className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2 text-base"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        ) : (
                            <Save className="h-5 w-5" />
                        )}
                        Guardar Trabajador
                    </Button>
                </div>

                {/* Warning if incomplete */}
                {!form.formState.isValid && form.formState.isSubmitted && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-100 dark:border-red-900 animate-bounce">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm font-bold">Por favor revisa los campos marcados en rojo antes de guardar.</p>
                    </div>
                )}
            </form>
        </Form>
    )
}
