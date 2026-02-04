'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Search, Filter, MoreVertical, CreditCard, Plus, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PagosPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form state para nuevo pago
    const [newPayment, setNewPayment] = useState({
        client_id: '',
        amount: '',
        method: 'Transferencia',
        date: format(new Date(), 'yyyy-MM-dd')
    });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                setUser(currentUser);

                if (currentUser) {
                    // 1. Fetch de pagos con nombre de cliente (JOIN)
                    const { data: paymentsData, error: pError } = await supabase
                        .from('payments')
                        .select('*, clients(name)')
                        .eq('business_id', currentUser.id)
                        .order('date', { ascending: false });

                    if (pError) throw pError;
                    setPayments(paymentsData || []);

                    // 2. Fetch de clientes para el selector de pago manual
                    const { data: clientsData, error: cError } = await supabase
                        .from('clients')
                        .select('id, name, monthly_amount')
                        .eq('business_id', currentUser.id);

                    if (cError) throw cError;
                    setClients(clientsData || []);
                }
            } catch (err) {
                console.error('Error loading payments:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newPayment.client_id) return;

        try {
            const paymentData = {
                business_id: user.id,
                client_id: newPayment.client_id,
                amount: Number(newPayment.amount),
                method: newPayment.method,
                date: newPayment.date,
                status: 'Completado'
            };

            const { data, error } = await supabase
                .from('payments')
                .insert([paymentData])
                .select('*, clients(name)');

            if (error) throw error;

            if (data && data[0]) {
                // 2. ACTUALIZACIÓN AUTOMÁTICA: Marcar al cliente como 'Pagado'
                const { error: updateError } = await supabase
                    .from('clients')
                    .update({ status: 'Pagado' })
                    .eq('id', newPayment.client_id);

                if (updateError) {
                    console.error('Error updating client status:', updateError);
                    // No bloqueamos el flujo principal si esto falla, pero lo logueamos
                }

                setPayments(prev => [data[0], ...prev]);
                setShowModal(false);
                setNewPayment({
                    client_id: '',
                    amount: '',
                    method: 'Transferencia',
                    date: format(new Date(), 'yyyy-MM-dd')
                });
            }
        } catch (err) {
            console.error('Error adding payment:', err);
            alert('Error al registrar el pago.');
        }
    };

    // Calcular estadísticas dinámicas
    const totalRevenue = payments.reduce((acc, curr) => acc + (curr.status === 'Completado' ? Number(curr.amount) : 0), 0);
    const pendingCount = clients.length - payments.length; // Simplificación
    const collectionRate = clients.length > 0 ? Math.round((payments.length / clients.length) * 100) : 0;

    const stats = [
        { label: 'Ingresos Totales', value: `$${totalRevenue}`, detail: 'Este mes', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Cobros Registrados', value: payments.length, detail: `${clients.length} alumnos totales`, icon: CheckCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Tasa de Cobro', value: `${collectionRate}%`, detail: collectionRate > 80 ? 'Excelente' : 'A mejorar', icon: ArrowUpRight, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    const filteredPayments = payments.filter(p =>
        p.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.method.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-5xl font-black mb-2 tracking-tight">Flujo de <span className="text-indigo-400">Caja</span></h1>
                    <p className="text-secondary text-lg">Monitorea tus ingresos y gestiona los cobros con precisión real.</p>
                </div>
                <button
                    className="btn btn-primary px-8"
                    onClick={() => setShowModal(true)}
                >
                    Registrar Cobro Manual
                </button>
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="glass-card group hover:scale-[1.02]" style={{ padding: '2.5rem', animationDelay: `${index * 100}ms` }}>
                            <div className="flex items-center justify-between mb-8">
                                <div className={`p-4 rounded-2xl ${stat.bg} border border-white/5`}>
                                    <Icon size={28} className={stat.color} />
                                </div>
                                <span className={`text-xs font-black uppercase tracking-widest ${stat.color}`}>{stat.detail}</span>
                            </div>
                            <h3 className="text-4xl font-black mb-1">{stat.value}</h3>
                            <p className="text-secondary text-[10px] uppercase tracking-widest font-black">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Search & List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Transacciones Recientes</h2>
                    <div className="flex gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-indigo-400 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar pago..."
                                className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-indigo-500/30 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-secondary transition-all">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] rounded-3xl border border-white/5 animate-pulse">
                            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                            <p className="text-secondary text-sm">Cargando transacciones...</p>
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
                            <p className="text-secondary">No hay cobros registrados aún.</p>
                        </div>
                    ) : (
                        filteredPayments.map((payment, index) => (
                            <div
                                key={payment.id}
                                className="glass-card flex items-center justify-between group hover:border-indigo-500/30"
                                style={{ padding: '1.5rem 2.5rem', animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black bg-emerald-500/10 text-emerald-400">
                                        $
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{payment.clients?.name}</h4>
                                        <p className="text-xs text-secondary flex items-center gap-2">
                                            {format(new Date(payment.date), "d 'de' MMMM", { locale: es })} • <span className="opacity-60">{payment.method}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12">
                                    <div className="text-right">
                                        <p className="font-black text-2xl">${payment.amount}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Completado</p>
                                    </div>
                                    <button className="text-secondary hover:text-white transition-colors">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal de Registro Manual */}
            {showModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowModal(false)}>
                    <div className="glass-card p-10 max-w-md w-full animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-black">Registrar <span className="text-indigo-400">Cobro</span></h2>
                            <button onClick={() => setShowModal(false)} className="text-secondary hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddPayment} className="space-y-6">
                            <div className="input-wrapper">
                                <label className="input-label">Seleccionar Alumno</label>
                                <select
                                    className="input-field"
                                    required
                                    value={newPayment.client_id}
                                    onChange={e => {
                                        const client = clients.find(c => c.id === e.target.value);
                                        setNewPayment({
                                            ...newPayment,
                                            client_id: e.target.value,
                                            amount: client ? client.monthly_amount.toString() : ''
                                        });
                                    }}
                                >
                                    <option value="" className="text-black">Elegir alumno...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-wrapper">
                                <label className="input-label">Monto a Cobrar</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="0.00"
                                    required
                                    value={newPayment.amount}
                                    onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
                                />
                            </div>
                            <div className="input-wrapper">
                                <label className="input-label">Método de Pago</label>
                                <select
                                    className="input-field"
                                    value={newPayment.method}
                                    onChange={e => setNewPayment({ ...newPayment, method: e.target.value })}
                                >
                                    <option value="Transferencia" className="text-black">Transferencia</option>
                                    <option value="Efectivo" className="text-black">Efectivo</option>
                                    <option value="Tarjeta" className="text-black">Tarjeta / Mercado Pago</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full btn btn-primary py-4">Registrar Pago</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="text-center pt-4">
                <button className="text-secondary font-bold text-xs hover:text-indigo-400 transition-colors uppercase tracking-widest">
                    Descargar Historial Completo (CSV)
                </button>
            </div>
        </div>
    );
}

