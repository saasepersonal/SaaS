-- ============================================================
-- ESQUEMA DE BASE DE DATOS - SaaS Gestión de Pagos
-- ============================================================

-- 1. Tabla de Perfil del Negocio (Configuración)
CREATE TABLE IF NOT EXISTS business_profile (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    business_name TEXT DEFAULT 'Mi Academia',
    contact_email TEXT,
    currency TEXT DEFAULT 'usd',
    language TEXT DEFAULT 'es',
    logo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Clientes (Alumnos)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT, -- Nuevo campo para WhatsApp
    is_minor BOOLEAN DEFAULT false,
    parent_email TEXT,
    monthly_amount DECIMAL(10,2) DEFAULT 0,
    due_day INTEGER DEFAULT 5,
    status TEXT DEFAULT 'Pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla de Pagos
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES auth.users(id) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Completado',
    method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (Cada usuario solo ve lo suyo)
-- Eliminamos políticas existentes para evitar errores al re-ejecutar el script
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON business_profile;
DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil" ON business_profile;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON business_profile;
DROP POLICY IF EXISTS "Usuarios pueden gestionar sus clientes" ON clients;
DROP POLICY IF EXISTS "Usuarios pueden gestionar sus pagos" ON payments;

-- Re-creamos las políticas con los permisos correctos
CREATE POLICY "Usuarios pueden ver su propio perfil" ON business_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden insertar su propio perfil" ON business_profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON business_profile FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden gestionar sus clientes" ON clients FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);
CREATE POLICY "Usuarios pueden gestionar sus pagos" ON payments FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);
