'use client';

import { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle, Clock, History, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RecordatoriosPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { label: 'Enviados Hoy', value: '0', icon: Send, color: 'text-indigo-400' },
        { label: 'Programados', value: '0', icon: Clock, color: 'text-warning' },
        { label: 'Eficiencia', value: '0%', icon: CheckCircle, color: 'text-emerald-400' },
    ]);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('notifications')
                    .select('*, clients(name)')
                    .eq('business_id', user.id)
                    .order('sent_at', { ascending: false });

                if (error) throw error;

                setNotifications(data || []);

                // Calcular estadísticas
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const sentToday = data?.filter(n => {
                    const sentDate = new Date(n.sent_at);
                    return sentDate >= today && n.status === 'Enviado';
                }).length || 0;

                const scheduled = data?.filter(n => n.status === 'Programado').length || 0;

                const total = data?.length || 0;
                const successful = data?.filter(n => n.status === 'Enviado').length || 0;
                const efficiency = total > 0 ? Math.round((successful / total) * 100) : 100;

                setStats([
                    { label: 'Enviados Hoy', value: sentToday.toString(), icon: Send, color: 'text-indigo-400' },
                    { label: 'Programados', value: scheduled.toString(), icon: Clock, color: 'text-warning' },
                    { label: 'Eficiencia', value: `${efficiency}%`, icon: CheckCircle, color: 'text-emerald-400' },
                ]);

            } catch (err) {
                console.error('Error fetching notifications:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

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
                    {loading ? (
                        <div className="py-20 text-center animate-pulse text-secondary">Cargando historial...</div>
                    ) : (
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
                                {notifications.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-secondary/40">No hay notificaciones enviadas aún.</td>
                                    </tr>
                                ) : (
                                    notifications.map((notification) => (
                                        <tr key={notification.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-6 px-2 font-bold text-white">{notification.clients?.name || 'Alumno eliminado'}</td>
                                            <td className="py-6 px-2 text-secondary text-sm">{notification.type}</td>
                                            <td className="py-6 px-2 text-secondary text-sm">
                                                {format(new Date(notification.sent_at), "d MMM, HH:mm", { locale: es })}
                                            </td>
                                            <td className="py-6 px-2">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${notification.method === 'Email' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    }`}>
                                                    {notification.method}
                                                </span>
                                            </td>
                                            <td className="py-6 px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${notification.status === 'Enviado' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                                                            notification.status === 'Programado' ? 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                                                                'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                                        }`} />
                                                    <span className="text-xs font-bold text-white">{notification.status}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-2 text-right">
                                                <button className="text-secondary hover:text-white transition-colors" title={notification.error_message}>
                                                    <MoreHorizontal size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
