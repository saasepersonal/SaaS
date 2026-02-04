'use client';

import { Bell, Send, CheckCircle, Clock, History, MoreHorizontal } from 'lucide-react';

const mockReminders = [
    { id: 1, client: 'María González', date: '4 Feb, 2026', type: 'Próximo Vencimiento', status: 'Enviado', method: 'Email' },
    { id: 2, client: 'Juan Pérez', date: '5 Feb, 2026', type: 'Recordatorio de Pago', status: 'Programado', method: 'WhatsApp' },
    { id: 3, client: 'Ana Martínez', date: '30 Ene, 2026', type: 'Pago Vencido', status: 'Error', method: 'Email' },
];

const stats = [
    { label: 'Enviados Hoy', value: '12', icon: Send, color: 'text-indigo-400' },
    { label: 'Programados', value: '45', icon: Clock, color: 'text-warning' },
    { label: 'Entregados', value: '98%', icon: CheckCircle, color: 'text-emerald-400' },
];

export default function RecordatoriosPage() {
    return (
        <div className="space-y-12 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-5xl font-black mb-2 tracking-tight"><span className="text-indigo-400">Recordatorios</span> Automáticos</h1>
                <p className="text-secondary text-lg">Historial y estado de las notificaciones enviadas a tus alumnos.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="glass-card flex items-center gap-6" style={{ padding: '2rem' }}>
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <Icon size={28} className={stat.color} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black">{stat.value}</h3>
                                <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content Tabs/History */}
            <div className="glass-card overflow-hidden" style={{ padding: '2.5rem' }}>
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <History size={20} />
                        </div>
                        <h2 className="text-2xl font-bold">Historial de Envíos</h2>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-widest text-secondary/50 font-black border-b border-white/5">
                                <th className="pb-4 px-2">Alumno</th>
                                <th className="pb-4 px-2">Tipo de Aviso</th>
                                <th className="pb-4 px-2">Fecha</th>
                                <th className="pb-4 px-2">Metodo</th>
                                <th className="pb-4 px-2">Estado</th>
                                <th className="pb-4 px-2 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {mockReminders.map((reminder) => (
                                <tr key={reminder.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-6 px-2 font-bold text-white">{reminder.client}</td>
                                    <td className="py-6 px-2 text-secondary text-sm">{reminder.type}</td>
                                    <td className="py-6 px-2 text-secondary text-sm">{reminder.date}</td>
                                    <td className="py-6 px-2">
                                        <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-1 rounded">
                                            {reminder.method}
                                        </span>
                                    </td>
                                    <td className="py-6 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${reminder.status === 'Enviado' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                                                    reminder.status === 'Programado' ? 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                                                        'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                                }`} />
                                            <span className="text-xs font-bold text-white">{reminder.status}</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-2 text-right">
                                        <button className="text-secondary hover:text-white transition-colors">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
