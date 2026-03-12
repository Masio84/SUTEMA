import * as z from "zod";

export const workerSchema = z.object({
    // Información Personal
    nombre: z.string().min(2, "Nombre es requerido"),
    apellido_paterno: z.string().min(2, "Apellido paterno es requerido"),
    apellido_materno: z.string().optional(),
    curp: z.string().length(18, "CURP debe tener 18 caracteres").toUpperCase(),
    sexo: z.enum(["Masculino", "Femenino", "Otro"]),
    estado_civil: z.enum(["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión Libre"]),
    telefono: z.string().min(10, "Formato de teléfono inválido").optional().or(z.literal("")),
    fecha_nacimiento: z.date().optional().nullable(),

    // Información Laboral
    adscripcion_id: z.string().min(1, "Adscripción es requerida"),
    unidad_id: z.string().optional().or(z.literal("")),
    fecha_ingreso: z.date({
        message: "Fecha de ingreso es requerida",
    }),
    estatus: z.enum(["activo", "inactivo", "baja", "jubilado"]),

    // Información Familiar
    tiene_hijos: z.boolean().default(false),
    hijos_menores_12: z.boolean().default(false),

    // Dirección
    calle: z.string().min(1, "Calle es requerida"),
    numero_exterior: z.string().min(1, "Número exterior es requerido"),
    numero_interior: z.string().optional(),
    colonia: z.string().min(1, "Colonia es requerida"),
    municipio: z.string().min(1, "Municipio es requerido"),

    // Datos Electorales
    seccion_ine: z.string().optional(),
    clave_elector: z.string().optional(),
});

export type WorkerFormValues = z.infer<typeof workerSchema>;
