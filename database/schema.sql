-- PostgreSQL Schema for SUTEMA Union Worker Management System (Supabase compatible)

-- 1. ADSCRIPCIONES (Departments/Locations)
CREATE TABLE IF NOT EXISTS adscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    clave TEXT UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- 2. UNIDADES (Units within departments)
CREATE TABLE IF NOT EXISTS unidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    clave TEXT UNIQUE,
    adscripcion_id UUID REFERENCES adscripciones(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nombre, adscripcion_id) -- Ensure unit names are unique within a department
);

-- 3. TRABAJADORES (Workers)
CREATE TABLE IF NOT EXISTS trabajadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Personal Information
    nombre TEXT NOT NULL,
    apellido_paterno TEXT NOT NULL,
    apellido_materno TEXT,
    curp TEXT UNIQUE NOT NULL CHECK (char_length(curp) = 18),
    sexo TEXT CHECK (sexo IN ('Masculino', 'Femenino', 'Otro')),
    estado_civil TEXT CHECK (estado_civil IN ('Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión Libre')),
    telefono TEXT,
    
    -- Address
    calle TEXT,
    numero_exterior TEXT,
    numero_interior TEXT,
    colonia TEXT,
    municipio TEXT,
    
    -- INE Data
    seccion_ine TEXT,
    clave_elector TEXT UNIQUE,
    
    -- Family Data
    tiene_hijos BOOLEAN DEFAULT FALSE,
    hijos_menores_12 INTEGER DEFAULT 0,
    
    -- Employment Data
    adscripcion_id UUID REFERENCES adscripciones(id) ON DELETE SET NULL,
    unidad_id UUID REFERENCES unidades(id) ON DELETE SET NULL,
    fecha_ingreso DATE,
    estatus TEXT NOT NULL DEFAULT 'Activo' CHECK (estatus IN ('Activo', 'Inactivo', 'Baja', 'Jubilado')),
    
    -- System Metadata
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USUARIOS_SISTEMA (Extended user mapping for Supabase Auth)
CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT,
    rol TEXT NOT NULL DEFAULT 'viewer' CHECK (rol IN ('admin', 'editor', 'viewer')),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUDITORIA_EDICIONES (Audit log)
CREATE TABLE IF NOT EXISTS auditoria_ediciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabla_m afectaba TEXT NOT NULL,
    registro_id UUID NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cambios JSONB NOT NULL, -- To store before/after values
    accion TEXT NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_trabajadores_curp ON trabajadores(curp);
CREATE INDEX IF NOT EXISTS idx_trabajadores_nombre_completo ON trabajadores(nombre, apellido_paterno, apellido_materno);
CREATE INDEX IF NOT EXISTS idx_trabajadores_adscripcion ON trabajadores(adscripcion_id);
CREATE INDEX IF NOT EXISTS idx_trabajadores_unidad ON trabajadores(unidad_id);
CREATE INDEX IF NOT EXISTS idx_unidades_adscripcion ON unidades(adscripcion_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_registro ON auditoria_ediciones(registro_id);

-- ROW LEVEL SECURITY (RLS) SETUP
ALTER TABLE adscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_ediciones ENABLE ROW LEVEL SECURITY;

-- POLICIES (Example: Assume authenticated users can read, only admins/editors can modify)

-- Policy: Authenticated users can read
CREATE POLICY "Allow authenticated read on adscripciones" ON adscripciones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on unidades" ON unidades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read on trabajadores" ON trabajadores FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Admin/Editor control for trabajadores
CREATE POLICY "Allow admin/editor update on trabajadores" ON trabajadores 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM usuarios_sistema 
            WHERE id = auth.uid() AND rol IN ('admin', 'editor')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_sistema 
            WHERE id = auth.uid() AND rol IN ('admin', 'editor')
        )
    );

-- TRIGGERS FOR VALIDATION / UPDATED_AT (Optional but recommended)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_adscripciones_modtime BEFORE UPDATE ON adscripciones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_unidades_modtime BEFORE UPDATE ON unidades FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trabajadores_modtime BEFORE UPDATE ON trabajadores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_usuarios_sistema_modtime BEFORE UPDATE ON usuarios_sistema FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
