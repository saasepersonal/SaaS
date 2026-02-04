'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, DollarSign, AlertCircle, Plus, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function getStatusBadge(status: string) {
    switch (status) {
        case 'Pagado': return 'badge badge-success';
        case 'Pendiente': return 'badge badge-warning';
        case 'Vencido': return 'badge badge-danger';
        default: return 'badge';
    }
}

export default function DashboardPage() {
    const [stats, setStats] = useState<any[]>([]);
    const [recentClients, setRecentClients] = useState<any[]>([]);
    const [businessName, setBusinessName] = useState('Admin');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. Cargar nombre del negocio
                const { data: profile } = await supabase
                    .from('business_profile')
                    .select('business_name')
                    .eq('id', user.id)
                    .single();

                if (profile) setBusinessName(profile.business_name);

                // 2. Cargar métricas reales
                const { data: clients, error: cError } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('business_id', user.id);

                if (cError) throw cError;

                const total = clients?.length || 0;
                const paid = clients?.filter(c => c.status === 'Pagado').length || 0;
                const pending = clients?.filter(c => c.status === 'Pendiente').length || 0;
                const expired = clients?.filter(c => c.status === 'Vencido').length || 0;

                setStats([
                    { label: 'Clientes Totales', value: total.toString(), icon: Users, accent: 'indigo', detail: 'Sincronizado' },
                    { label: 'Pagados', value: paid.toString(), percentage: total > 0 ? `${Math.round((paid / total) * 100)}%` : '0%', icon: DollarSign, accent: 'emerald', detail: 'Al día' },
                    { label: 'Pendientes', value: pending.toString(), icon: TrendingUp, accent: 'warning', detail: 'Cobros este mes' },
                    { label: 'Vencidos', value: expired.toString(), icon: AlertCircle, accent: 'danger', detail: 'Acción requerida' },
                ]);

                // 3. Actividad Reciente (últimos 3 clientes registrados)
                const { data: recent } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('business_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                setRecentClients(recent || []);

            } catch (err) {
                console.error('Error loading dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Greeting Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-5xl font-black mb-2 tracking-tight">
                        Buenas tardes, <span className="text-indigo-400">{businessName}</span>
                    </h1>
                    <p className="text-secondary text-lg">
                        Aquí tienes el pulso de tu negocio en tiempo real.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/clientes" className="btn btn-primary px-8">
                        <Plus size={20} />
                        Nuevo Cliente
                    </Link>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="glass-card h-48 animate-pulse bg-white/5" />
                    ))
                ) : (
                    stats.map((metric, index) => {
                        const Icon = metric.icon;
                        return (
                            <div
                                key={metric.label}
                                className="glass-card group hover:scale-[1.02]"
                                style={{ padding: '2.5rem', animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className={`p-4 rounded-2xl bg-white/[0.03] border border-white/5`}>
                                        <Icon size={28} className={`text-white group-hover:text-indigo-400 transition-colors`} />
                                    </div>
                                    {metric.percentage && (
                                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded-lg">
                                            <ArrowUpRight size={14} />
                                            {metric.percentage}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-5xl font-black tracking-tighter">{metric.value}</h3>
                                    <p className="text-secondary font-bold text-sm uppercase tracking-widest">{metric.label}</p>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <p className="text-[10px] text-secondary/60 uppercase font-black tracking-widest">{metric.detail}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Activity Table */}
                <div className="xl:col-span-2 glass-card" style={{ padding: '2.5rem' }}>
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Actividad Reciente</h2>
                            <p className="text-secondary text-sm">Últimos registros en la nube</p>
                        </div>
                        <Link href="/dashboard/clientes" className="text-indigo-400 font-bold text-sm hover:underline">
                            Ver todo
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-[10px] uppercase tracking-widest text-secondary/50 font-black border-b border-white/5">
                                    <th className="pb-4 px-2">Alumno</th>
                                    <th className="pb-4 px-2">Estado</th>
                                    <th className="pb-4 px-2 text-right">Cuota</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={3} className="py-10 text-center text-secondary">Sincronizando...</td></tr>
                                ) : recentClients.length === 0 ? (
                                    <tr><td colSpan={3} className="py-10 text-center text-secondary">No hay alumnos registrados.</td></tr>
                                ) : (
                                    recentClients.map((client, index) => (
                                        <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-6 px-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm">
                                                        {client.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-white">{client.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-2">
                                                <span className={getStatusBadge(client.status)}>
                                                    {client.status}
                                                </span>
                                            </td>
                                            <td className="py-6 px-2 text-right font-black text-xl">${client.monthly_amount}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Panel - Quick Summary */}
                <div className="glass-card flex flex-col justify-between overflow-hidden" style={{ padding: '2.5rem' }}>
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Próximos Cobros</h2>
                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                                <p className="text-indigo-400 font-bold text-xs uppercase mb-2">Tip de Gestión</p>
                                <p className="text-sm text-secondary leading-relaxed">
                                    Recuerda registrar cada cobro manual para mantener tus estadísticas actualizadas.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <p className="text-white font-bold text-xs uppercase mb-2">Meta Mensual</p>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-indigo-500 w-[45%]" />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold uppercase text-secondary">
                                    <span>Progreso: 45%</span>
                                    <span>Saludable</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="w-full btn glass-button mt-8">
                        Generar Reporte Mensual
                    </button>
                </div>
            </div>
        </div>
    );
}
