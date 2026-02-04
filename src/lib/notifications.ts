/**
 * Utilidades para notificaciones de WhatsApp
 */

export const generateWhatsAppLink = (phone: string, message: string) => {
    // Limpiar el número de teléfono (quitar espacios, guiones, etc.)
    const cleanPhone = phone.replace(/\D/g, '');

    // Si el número no tiene código de país, podrías añadir uno por defecto si sabes el mercado principal
    // Por ahora asumimos que el usuario ingresa el número con código o que wa.me lo maneja

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const getPaymentMessage = (businessName: string, clientName: string, amount: number) => {
    return `Hola ${clientName}! 👋 Somos de ${businessName}. Queríamos confirmarte que recibimos tu pago de $${amount}. ¡Muchas gracias! 😊`;
};

export const getReminderMessage = (businessName: string, clientName: string, amount: number, dueDate: number) => {
    return `Hola ${clientName}! 👋 Te saludamos de ${businessName}. Te recordamos que tu cuota de $${amount} vence el día ${dueDate}. ¡Que tengas un excelente día! 🚀`;
};

export const getOverdueMessage = (businessName: string, clientName: string, amount: number) => {
    return `Hola ${clientName}! 👋 Te contactamos de ${businessName}. Notamos que tu cuota de $${amount} se encuentra pendiente. Por favor, avísanos si necesitas ayuda con el pago. ¡Saludos!`;
};
