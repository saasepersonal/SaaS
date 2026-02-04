'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Mail, Calendar, DollarSign, X, Filter, MoreVertical, FileUp, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Client, ClientStatus } from '@/types';
import { generateWhatsAppLink, getOverdueMessage, getReminderMessage } from '@/lib/notifications';

function getStatusBadge(status: ClientStatus) {
    switch (status) {
        case 'Pagado': return 'badge badge-success';
        case 'Pendiente': return 'badge badge-warning';
        case 'Vencido': return 'badge badge-danger';
        default: return 'badge badge-warning';
    }
}

export default function ClientesPage() {
    const [clients, setClients] = useState<(Client & { status: ClientStatus })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [businessProfile, setBusinessProfile] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        phone: '',
        is_minor: false,
        parent_email: '',
        monthly_amount: '',
        due_day: '5'
    });

    // Cargar usuario y clientes al montar
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // 1. Obtener usuario actual
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                setUser(currentUser);

                if (currentUser) {
                    // 2. Fetch de clientes desde Supabase
                    const { data, error } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('business_id', currentUser.id)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setClients(data || []);

                    // 3. Fetch perfil de negocio (para el branding de emails)
                    const { data: profile } = await supabase
                        .from('business_profile')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();
                    setBusinessProfile(profile);
                }
            } catch (err) {
                console.error('Error loading clients:', err);
                alert('No se pudieron cargar los alumnos.');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const clientData = {
                business_id: user.id,
                name: newClient.name,
                email: newClient.email,
                phone: newClient.phone,
                is_minor: newClient.is_minor,
                parent_email: newClient.parent_email,
                monthly_amount: Number(newClient.monthly_amount) || 0,
                due_day: Number(newClient.due_day) || 5,
                status: 'Pendiente' as ClientStatus,
            };

            const { data, error } = await supabase
                .from('clients')
                .insert([clientData])
                .select();

            if (error) throw error;

            if (data && data[0]) {
                setClients(prev => [data[0], ...prev]);
                setNewClient({ name: '', email: '', phone: '', is_minor: false, parent_email: '', monthly_amount: '', due_day: '5' });
                setShowModal(false);
            }
        } catch (err: any) {
            console.error('Error adding client:', err);
            alert('Error al registrar el alumno: ' + (err.message || 'Error desconocido'));
        }
    };

    const handleStatusChange = async (id: string, currentStatus: ClientStatus) => {
        // Ciclo simple: Pendiente -> Pagado -> Vencido -> Pendiente
        const nextStatus: ClientStatus =
            currentStatus === 'Pendiente' ? 'Pagado' :
                currentStatus === 'Pagado' ? 'Vencido' : 'Pendiente';

        try {
            const { error } = await supabase
                .from('clients')
                .update({ status: nextStatus })
                .eq('id', id);

            if (error) throw error;

            setClients(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
        } catch (err) {
            console.error('Error changing status:', err);
            alert('Error al actualizar el estado.');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                parseCSV(text);
            };
            reader.readAsText(file);
        }
    };

    const parseCSV = (text: string) => {
        const lines = text.split('\n');
        const result = [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            const currentline = lines[i].split(',');
            const obj: any = {};
            for (let j = 0; j < headers.length; j++) {
                const key = headers[j];
                obj[key] = currentline[j]?.trim();
            }
            result.push(obj);
        }
        setImportData(result);
    };

    const confirmImport = async () => {
        if (!user || importData.length === 0) return;

        try {
            const formattedClients = importData.map(data => ({
                business_id: user.id,
                name: data.nombre || data.name || 'Sin Nombre',
                email: data.email || data.correo || '',
                is_minor: false,
                monthly_amount: Number(data.monto || data.amount) || 0,
                due_day: Number(data.vencimiento || data.due) || 5,
                status: 'Pendiente' as ClientStatus,
            }));

            const { data, error } = await supabase
                .from('clients')
                .insert(formattedClients)
                .select();

            if (error) throw error;

            if (data) {
                setClients(prev => [...data, ...prev]);
                setShowImportModal(false);
                setImportData([]);
                alert(`Se han importado ${data.length} alumnos correctamente.`);
            }
        } catch (err) {
            console.error('Error importing clients:', err);
            alert('Error durante la importación masiva.');
        }
    };

    const downloadTemplate = () => {
        const headers = "Nombre,Email,Monto,Vencimiento\nJuan Perez,juan@example.com,50,5\nMaria Lopez,maria@example.com,45,10";
        const blob = new Blob([headers], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'plantilla_alumnos.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-5xl font-black mb-2 tracking-tight">Gestión de <span className="text-indigo-400">Clientes</span></h1>
                    <p className="text-secondary text-lg">
                        Administra y contacta a tus {clients.length} alumnos registrados.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="btn glass-button px-6"
                        onClick={() => setShowImportModal(true)}
                    >
                        <FileUp size={20} />
                        Importar (CSV)
                    </button>
                    <button
                        className="btn btn-primary px-8"
                        onClick={() => setShowModal(true)}
                    >
                        <Plus size={20} />
                        Nuevo Alumno
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        className="input-field w-full pl-12 py-4 rounded-2xl bg-white/[0.03] border-white/5 focus:bg-white/[0.05]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn glass-button px-4">
                    <Filter size={20} />
                </button>
            </div>

            {/* Clients Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] rounded-3xl border border-white/5 animate-pulse">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-secondary font-medium">Sincronizando con la nube...</p>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5 animate-fade-in">
                    <p className="text-secondary text-lg">No se encontraron alumnos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
                    {filteredClients.map((client, index) => (
                        <div
                            key={client.id}
                            className="glass-card group hover:scale-[1.03]"
                            style={{ padding: '2rem', animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-black text-2xl text-indigo-300">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl group-hover:text-indigo-300 transition-colors">{client.name}</h3>
                                        <p className="text-xs text-secondary mt-1 flex items-center gap-1 font-medium truncate max-w-[150px]">
                                            <Mail size={12} />
                                            {client.email}
                                        </p>
                                        {client.phone && (
                                            <p className="text-xs text-secondary mt-1 flex items-center gap-1 font-medium truncate max-w-[150px]">
                                                <span className="text-emerald-400">📱</span>
                                                {client.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button className="text-secondary hover:text-white transition-colors">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-[10px] uppercase tracking-widest text-secondary font-black">Estado</span>
                                    <span
                                        className={`${getStatusBadge(client.status)} cursor-pointer hover:scale-110 transition-transform`}
                                        onClick={() => handleStatusChange(client.id, client.status)}
                                        title="Haz clic para cambiar estado"
                                    >
                                        {client.status}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-[10px] uppercase tracking-widest text-secondary font-black">Cobro Mensual</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-2xl font-black">${client.monthly_amount}</span>
                                        <span className="text-[10px] text-secondary/60 font-bold">/mes</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-[10px] uppercase tracking-widest text-secondary font-black">Vencimiento</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-indigo-400" />
                                        <span className="font-bold">Día {client.due_day}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <div className="mt-8 flex gap-3">
                                    {client.phone ? (
                                        <a
                                            href={generateWhatsAppLink(client.phone, client.status === 'Vencido' ? getOverdueMessage('Mi Negocio', client.name, client.monthly_amount) : getReminderMessage('Mi Negocio', client.name, client.monthly_amount, client.due_day))}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 btn glass-button text-xs py-2.5 flex items-center justify-center gap-2 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                                        >
                                            WhatsApp
                                        </a>
                                    ) : (
                                        <button disabled className="flex-1 btn glass-button text-xs py-2.5 opacity-50 cursor-not-allowed" title="Sin teléfono registrado">
                                            WhatsApp
                                        </button>
                                    )}

                                    {client.email ? (
                                        <button
                                            className="flex-1 btn glass-button text-xs py-2.5 flex items-center justify-center gap-2 hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                                            onClick={async () => {
                                                if (!confirm('¿Enviar recordatorio por email a ' + client.email + '?')) return;
                                                try {
                                                    const res = await fetch('/api/send-email', {
                                                        method: 'POST',
                                                        body: JSON.stringify({
                                                            to: client.email,
                                                            subject: `Recordatorio de ${businessProfile?.business_name || 'Tu Gimnasio'}`,
                                                            html: `<p>Hola ${client.name}, este es un recordatorio de tu cuota de $${client.monthly_amount}.</p>`,
                                                            businessName: businessProfile?.business_name || 'Mi Negocio',
                                                            logoUrl: businessProfile?.logo_url,
                                                            clientName: client.name
                                                        })
                                                    });
                                                    const data = await res.json();
                                                    if (!res.ok) throw new Error(data.error || 'Error desconocido del servidor');

                                                    alert('Email enviado correctamente! 📧');
                                                } catch (e: any) {
                                                    alert('Error al enviar email: ' + e.message);
                                                }
                                            }}
                                        >
                                            Email
                                        </button>
                                    ) : (
                                        <button disabled className="flex-1 btn glass-button text-xs py-2.5 opacity-50 cursor-not-allowed">
                                            Email
                                        </button>
                                    )}
                                </div>
                                <button className="flex-1 btn glass-button text-xs py-2.5">
                                    Ver Perfil
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal para Nuevo Cliente */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="glass-card p-10 max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-3xl font-black tracking-tight">Nuevo <span className="text-indigo-400">Alumno</span></h2>
                            <button onClick={() => setShowModal(false)} className="text-secondary hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddClient} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="input-wrapper">
                                    <label className="input-label">Nombre Completo</label>
                                    <input type="text" className="input-field" placeholder="Ej: Laura López" required value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
                                </div>
                                <div className="input-wrapper">
                                    <label className="input-label">Email Principal</label>
                                    <input type="email" className="input-field" placeholder="laura@ejemplo.com" required value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                                </div>
                                <div className="input-wrapper col-span-2 md:col-span-2">
                                    <label className="input-label">Teléfono (WhatsApp)</label>
                                    <input type="tel" className="input-field" placeholder="54911..." value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="input-wrapper">
                                    <label className="input-label">Monto Mensual</label>
                                    <input type="number" className="input-field" placeholder="50" required value={newClient.monthly_amount} onChange={e => setNewClient({ ...newClient, monthly_amount: e.target.value })} />
                                </div>
                                <div className="input-wrapper">
                                    <label className="input-label">Día de Vencimiento</label>
                                    <input type="number" className="input-field" placeholder="5" required value={newClient.due_day} onChange={e => setNewClient({ ...newClient, due_day: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="w-full btn btn-primary py-4 mt-4">Registrar Alumno</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para Importar CSV */}
            {showImportModal && (
                <div
                    className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-50 animate-fade-in p-4"
                    onClick={() => setShowImportModal(false)}
                >
                    <div
                        className="glass-card p-10 max-w-2xl w-full animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-black">Importar <span className="text-indigo-400">Datos</span></h2>
                                <p className="text-secondary text-sm">Carga tu archivo de Excel o Google Sheets (formato CSV).</p>
                            </div>
                            <button onClick={() => setShowImportModal(false)} className="text-secondary hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {importData.length === 0 ? (
                            <div className="space-y-8">
                                <div
                                    className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:bg-white/[0.02] hover:border-indigo-500/30 transition-all cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <FileUp size={48} className="mx-auto mb-4 text-secondary group-hover:text-indigo-400 transition-colors" />
                                    <p className="font-bold text-lg mb-2">Haz clic para subir o arrastra tu archivo</p>
                                    <p className="text-secondary text-sm">Solo archivos .csv (separados por comas)</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                    />
                                </div>

                                <div className="bg-white/[0.03] p-6 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="font-bold">¿No tienes el formato?</p>
                                        <p className="text-xs text-secondary">Descarga nuestra plantilla de ejemplo para asegurar una carga exitosa.</p>
                                    </div>
                                    <button
                                        className="btn glass-button text-xs gap-2"
                                        onClick={downloadTemplate}
                                    >
                                        <Download size={14} /> Plantilla
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-4 text-emerald-400">
                                    <CheckCircle size={24} />
                                    <div>
                                        <p className="font-bold">Archivo procesado con éxito</p>
                                        <p className="text-xs opacity-80">Se encontraron {importData.length} registros listos para importar.</p>
                                    </div>
                                </div>

                                <div className="max-h-60 overflow-y-auto border border-white/5 rounded-2xl bg-black/20">
                                    <table className="w-full text-left text-xs">
                                        <thead className="sticky top-0 bg-[#0d0d15] border-b border-white/5">
                                            <tr>
                                                <th className="p-3 text-secondary uppercase tracking-widest text-[9px] font-black">Nombre</th>
                                                <th className="p-3 text-secondary uppercase tracking-widest text-[9px] font-black">Email</th>
                                                <th className="p-3 text-secondary uppercase tracking-widest text-[9px] font-black">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importData.map((row, i) => (
                                                <tr key={i} className="border-b border-white/5">
                                                    <td className="p-3 font-bold">{row.nombre || row.name}</td>
                                                    <td className="p-3 text-secondary">{row.email || row.correo}</td>
                                                    <td className="p-3 text-indigo-400 font-bold">${row.monto || row.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        className="flex-1 btn glass-button py-4"
                                        onClick={() => setImportData([])}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="flex-1 btn btn-primary py-4"
                                        onClick={confirmImport}
                                    >
                                        Confirmar Importación
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex items-start gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                            <AlertCircle size={18} className="text-indigo-400 shrink-0" />
                            <p className="text-[10px] text-secondary leading-relaxed font-medium">
                                Asegúrate de que los encabezados del archivo coincidan con los de la plantilla. El nombre y el email son campos obligatorios.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
