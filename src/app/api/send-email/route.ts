import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
    try {
        const { to, subject, html, businessName, clientName, logoUrl, clientId, businessId, type } = await request.json();

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            return NextResponse.json(
                { error: 'Credenciales SMTP no configuradas' },
                { status: 500 }
            );
        }

        let result;
        let errorMsg = null;
        let status = 'Enviado';

        try {
            result = await sendEmail({
                to,
                subject,
                businessName,
                clientName: clientName || 'Cliente',
                htmlContent: html,
                logoUrl
            });
        } catch (e: any) {
            console.error('Email Send Error:', e);
            errorMsg = e.message;
            status = 'Error';
        }

        // Registrar en la base de datos si tenemos la info necesaria
        if (clientId && businessId) {
            await supabaseServer.from('notifications').insert({
                business_id: businessId,
                client_id: clientId,
                type: type || 'Email Informativo',
                method: 'Email',
                status: status,
                error_message: errorMsg
            });
        }

        if (status === 'Error') {
            return NextResponse.json({ error: errorMsg }, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Error enviando email' }, { status: 500 });
    }
}
