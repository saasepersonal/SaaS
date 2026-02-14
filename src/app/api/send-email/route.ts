import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { to, subject, html, businessName, clientName, logoUrl, clientId, businessId, type } = await request.json();

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            return NextResponse.json(
                { error: 'Credenciales SMTP no configuradas' },
                { status: 500 }
            );
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Ignored if called from a Server Component
                        }
                    },
                },
            }
        );

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
            const { error: dbError } = await supabase.from('notifications').insert({
                business_id: businessId,
                client_id: clientId,
                type: type || 'Email Informativo',
                method: 'Email',
                status: status,
                error_message: errorMsg
            });

            if (dbError) {
                console.error('Database Insert Error (Notifications):', dbError);
            }
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
