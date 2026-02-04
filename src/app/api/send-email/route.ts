import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { to, subject, html, businessName, clientName, logoUrl } = await request.json();

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            return NextResponse.json(
                { error: 'Credenciales SMTP no configuradas' },
                { status: 500 }
            );
        }

        const result = await sendEmail({
            to,
            subject,
            businessName,
            clientName: clientName || 'Cliente',
            htmlContent: html,
            logoUrl
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Error enviando email' }, { status: 500 });
    }
}
