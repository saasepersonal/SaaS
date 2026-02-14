import nodemailer from 'nodemailer';

interface EmailTemplateOptions {
    businessName: string;
    logoUrl?: string; // Opcional, si no hay se usa texto
    clientName: string;
    contentHtml: string;
    ctaText?: string;
    ctaLink?: string;
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Genera un template HTML profesional y responsive
 */
const generateEmailHtml = ({ businessName, logoUrl, clientName, contentHtml, ctaText, ctaLink }: EmailTemplateOptions) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificación de ${businessName}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { background-color: #ffffff; padding: 30px 40px; text-align: center; border-bottom: 1px solid #f0f0f0; }
        .logo { max-height: 40px; width: auto; object-fit: contain; } /* Logo controlado */
        .business-text { font-size: 20px; font-weight: 700; color: #333; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 40px; color: #4b5563; line-height: 1.6; font-size: 16px; }
        .greeting { font-size: 22px; font-weight: 600; color: #111827; margin-bottom: 20px; }
        .btn-container { text-align: center; margin-top: 30px; }
        .btn { display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.3s; }
        .btn:hover { background-color: #4f46e5; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Cabecera Dinámica -->
        <div class="header">
            ${logoUrl
            ? `<img src="${logoUrl}" alt="${businessName}" class="logo">`
            : `<h1 class="business-text">${businessName}</h1>`
        }
        </div>

        <!-- Contenido -->
        <div class="content">
            <h2 class="greeting">Hola, ${clientName} 👋</h2>
            ${contentHtml}
            
            ${ctaText && ctaLink ? `
            <div class="btn-container">
                <a href="${ctaLink}" class="btn">${ctaText}</a>
            </div>
            ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Este mensaje fue enviado por <strong>${businessName}</strong>.</p>
            <p>© ${new Date().getFullYear()} Gestión de Pagos.</p>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Función principal para enviar emails
 */
export const sendEmail = async ({
    to,
    subject,
    businessName,
    logoUrl,
    clientName,
    htmlContent
}: {
    to: string;
    subject: string;
    businessName: string;
    logoUrl?: string;
    clientName: string;
    htmlContent: string;
}) => {
    try {
        const mailOptions = {
            from: `"${businessName}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: generateEmailHtml({
                businessName,
                logoUrl,
                clientName,
                contentHtml: htmlContent
            }),
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
