-- 1. Tabla de Clases/Turnos (Ej: "Lunes 18hs Yoga")
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    day_of_week INTEGER NOT NULL, -- 1=Lunes, 7=Domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla Intermedia: Inscripciones (Un alumno puede ir a varias clases)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, class_id)
);

-- 3. Tabla de Asistencia: Registro por día y clase
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Modificar Tabla Clientes: Agregar estado Activo/Inactivo
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Políticas de Seguridad (RLS) - Permite que solo el dueño vea sus datos
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own classes" ON classes
    USING (auth.uid() = business_id);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage enrollments via clients" ON enrollments
    USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = enrollments.client_id AND clients.business_id = auth.uid()));

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage attendance via classes" ON attendance
    USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance.class_id AND classes.business_id = auth.uid()));
