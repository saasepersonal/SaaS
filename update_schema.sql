-- Ejecuta este comando en el SQL Editor de Supabase para agregar la columna que falta
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
