-- ============================================================
-- NUEVA TABLA: NOTIFICATIONS (Historial de Recordatorios)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES auth.users(id) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'Próximo Vencimiento', 'Recordatorio de Pago', 'Pago Vencido', etc.
    method TEXT NOT NULL, -- 'Email', 'WhatsApp'
    status TEXT NOT NULL, -- 'Enviado', 'Programado', 'Error'
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias notificaciones" ON notifications;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias notificaciones" ON notifications;

CREATE POLICY "Usuarios pueden ver sus propias notificaciones" ON notifications 
    FOR SELECT USING (auth.uid() = business_id);

CREATE POLICY "Usuarios pueden insertar sus propias notificaciones" ON notifications 
    FOR INSERT WITH CHECK (auth.uid() = business_id);
