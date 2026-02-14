// Types para el sistema
export interface Client {
    id: string;
    business_id: string;
    name: string;
    email: string;
    phone?: string; // Nuevo campo para WhatsApp
    is_minor: boolean;
    parent_email?: string;
    monthly_amount: number;
    due_day: number; // Día del mes (1-31)
    is_active?: boolean; // Nuevo campo para desactivar temporalmente
    created_at: string;
}

export interface ClassItem {
    id: string;
    business_id: string;
    name: string;
    day_of_week: number; // 1=Lunes, 7=Domingo
    start_time: string;
    end_time: string;
}

export interface Enrollment {
    id: string;
    client_id: string;
    class_id: string;
}

export interface Attendance {
    id: string;
    class_id: string;
    client_id: string;
    date: string;
    status: 'present' | 'absent' | 'late';
}

export interface Payment {
    id: string;
    client_id: string;
    business_id: string;
    amount: number;
    paid_at: string;
    period_month: number;
    period_year: number;
}

export interface Business {
    id: string;
    name: string;
    logo_url?: string;
    email: string;
    currency: string;
    email_settings?: EmailSettings;
}

export interface EmailSettings {
    before_days: number;
    after_days: number;
    template_reminder: string;
    template_overdue: string;
    send_to_client: boolean;
    send_to_parent: boolean;
}

export type ClientStatus = 'Pagado' | 'Pendiente' | 'Vencido';
