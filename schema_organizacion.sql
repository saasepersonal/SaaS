-- TABLA CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    day_of_week INTEGER NOT NULL, -- 1=Lunes, 7=Domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias clases" ON classes
    FOR SELECT USING (auth.uid() = business_id);

CREATE POLICY "Usuarios pueden crear sus propias clases" ON classes
    FOR INSERT WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Usuarios pueden actualizar sus propias clases" ON classes
    FOR UPDATE USING (auth.uid() = business_id);

CREATE POLICY "Usuarios pueden eliminar sus propias clases" ON classes
    FOR DELETE USING (auth.uid() = business_id);


-- TABLA ENROLLMENTS (Inscripciones)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id, class_id)
);

-- RLS para enrollments (Usando el business_id de la clase)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver inscripciones de sus clases" ON enrollments
    FOR SELECT USING (
        class_id IN (SELECT id FROM classes WHERE business_id = auth.uid())
    );

CREATE POLICY "Usuarios pueden gestionar inscripciones de sus clases" ON enrollments
    FOR ALL USING (
        class_id IN (SELECT id FROM classes WHERE business_id = auth.uid())
    );


-- TABLA ATTENDANCE (Asistencia)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'late')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(class_id, client_id, date)
);

-- RLS para attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver asistencia de sus clases" ON attendance
    FOR SELECT USING (
        class_id IN (SELECT id FROM classes WHERE business_id = auth.uid())
    );

CREATE POLICY "Usuarios pueden gestionar asistencia de sus clases" ON attendance
    FOR ALL USING (
        class_id IN (SELECT id FROM classes WHERE business_id = auth.uid())
    );


-- CAMPO ACTIVO EN CLIENTES (Si no existe, aunque ya debería estar en el types, aseguramos DB)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
