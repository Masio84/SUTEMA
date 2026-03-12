-- Función para actualizar la fecha de modificación automáticamente (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Script para habilitar la gestión de autoridades y automatización de copias
CREATE TABLE IF NOT EXISTS autoridades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    cargo TEXT NOT NULL,
    adscripcion_id INTEGER REFERENCES adscripciones(id) ON DELETE CASCADE,
    unidad_id INTEGER REFERENCES unidades(id) ON DELETE CASCADE,
    copias TEXT[] DEFAULT '{}',
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE autoridades ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (lectura para autenticados, escritura para admin)
CREATE POLICY "Allow authenticated read on autoridades" ON autoridades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin manage autoridades" ON autoridades FOR ALL USING (
    EXISTS (
        SELECT 1 FROM usuarios_sistema 
        WHERE id = auth.uid() AND rol IN ('admin', 'editor')
    )
);

-- Trigger para fecha de actualización
CREATE TRIGGER update_autoridades_modtime BEFORE UPDATE ON autoridades FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
