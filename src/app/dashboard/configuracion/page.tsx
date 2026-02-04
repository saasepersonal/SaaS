'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Bell, Shield, Mail, Globe, Palette, Save, ArrowLeft, Camera, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ConfiguracionPage() {
    // State para persistencia en Supabase
    const [config, setConfig] = useState({
        businessName: '',
        email: '',
        currency: 'usd',
        language: 'es',
        logo: null as string | null
    });

    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('perfil');
    const [user, setUser] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cargar datos de Supabase al iniciar
    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                setUser(currentUser);

                if (currentUser) {
                    const { data, error } = await supabase
                        .from('business_profile')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();

                    if (error && error.code !== 'PGRST116') throw error; // PGRST116 es "no rows found"

                    if (data) {
                        setConfig({
                            businessName: data.business_name || '',
                            email: data.contact_email || '',
                            currency: data.currency || 'usd',
                            language: data.language || 'es',
                            logo: data.logo_url || null
                        });
                    }
                }
            } catch (err) {
                console.error('Error loading profile:', err);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    // Guardar cambios en Supabase
    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('business_profile')
                .upsert({
                    id: user.id,
                    business_name: config.businessName,
                    contact_email: config.email,
                    currency: config.currency,
                    language: config.language,
                    logo_url: config.logo,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Actualizar también localStorage para compatibilidad inmediata
            localStorage.setItem('saas_config', JSON.stringify(config));

            // Disparar evento para el Sidebar
            window.dispatchEvent(new Event('configUpdated'));
            alert('¡Configuración guardada en la nube!');
        } catch (err) {
            console.error('Error saving profile:', err);
            alert('Error al guardar la configuración.');
        } finally {
            setIsSaving(false);
        }
    };

    // Manejar carga de logo (Mantiene base64 por ahora para simplicidad, idealmente iría a Supabase Storage)
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setConfig(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                <div>
                    <h1 className="text-5xl font-black mb-2 tracking-tight">Configuración</h1>
                    {loading ? (
                        <div className="flex items-center gap-2 text-indigo-400">
                            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="text-sm font-bold uppercase tracking-widest">Sincronizando perfil...</p>
                        </div>
                    ) : (
                        <p className="text-secondary text-lg">Personaliza tu plataforma y ajusta las preferencias de tu negocio.</p>
                    )}
                </div>
                <button
                    className={`btn btn-primary px-10 py-4 shadow-2xl transition-all ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={20} />
                    )}
                    <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Sidebar Config Rediseñado para Legibilidad */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary/50 px-4 mb-4">Menú de Ajustes</p>

                    <button
                        onClick={() => setActiveTab('perfil')}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all border ${activeTab === 'perfil'
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-white shadow-lg shadow-indigo-500/5'
                            : 'bg-white/[0.02] border-white/5 text-secondary hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Palette size={18} className={activeTab === 'perfil' ? 'text-indigo-400' : ''} />
                            <span className="font-bold text-sm">Perfil y Estética</span>
                        </div>
                        {activeTab === 'perfil' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                    </button>

                    <button
                        onClick={() => setActiveTab('notificaciones')}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all border ${activeTab === 'notificaciones'
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-white shadow-lg shadow-indigo-500/5'
                            : 'bg-white/[0.02] border-white/5 text-secondary hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Bell size={18} className={activeTab === 'notificaciones' ? 'text-indigo-400' : ''} />
                            <span className="font-bold text-sm">Notificaciones</span>
                        </div>
                        {activeTab === 'notificaciones' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>

                    <button
                        onClick={() => setActiveTab('whatsapp')}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all border ${activeTab === 'whatsapp'
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-white shadow-lg shadow-indigo-500/5'
                            : 'bg-white/[0.02] border-white/5 text-secondary hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Mail size={18} className={activeTab === 'whatsapp' ? 'text-indigo-400' : ''} />
                            <span className="font-bold text-sm">Plantillas WhatsApp</span>
                        </div>
                        {activeTab === 'whatsapp' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>

                    <button
                        onClick={() => setActiveTab('seguridad')}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all border ${activeTab === 'seguridad'
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-white shadow-lg shadow-indigo-500/5'
                            : 'bg-white/[0.02] border-white/5 text-secondary hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Shield size={18} className={activeTab === 'seguridad' ? 'text-indigo-400' : ''} />
                            <span className="font-bold text-sm">Seguridad</span>
                        </div>
                        {activeTab === 'seguridad' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>

                    <div className="mt-10 p-6 glass-card border-indigo-500/20 bg-indigo-500/5">
                        <div className="flex items-center gap-2 text-indigo-400 mb-2">
                            <AlertCircle size={16} />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Sincronización</p>
                        </div>
                        <p className="text-xs text-secondary leading-relaxed">Sus cambios se guardan localmente hasta la sincronización con la nube.</p>
                    </div>
                </div>

                {/* Main Config Form Area */}
                <div className="lg:col-span-3 space-y-10">
                    {/* Perfil y Estética Content */}
                    {activeTab === 'perfil' && (
                        <div className="animate-fade-in space-y-10">
                            {/* General Section */}
                            <div className="glass-card" style={{ padding: '3.5rem' }}>
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        <Globe size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black">Información del Negocio</h2>
                                        <p className="text-secondary text-sm">Configuración básica de indentidad.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="input-wrapper">
                                        <label className="input-label">Nombre del Estudio/Academia</label>
                                        <input
                                            type="text"
                                            className="input-field py-4 px-6 text-lg font-bold"
                                            value={config.businessName}
                                            onChange={e => setConfig({ ...config, businessName: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <label className="input-label">Email de Contacto</label>
                                        <input
                                            type="email"
                                            className="input-field py-4 px-6 text-lg"
                                            value={config.email}
                                            onChange={e => setConfig({ ...config, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <label className="input-label">Moneda Principal</label>
                                        <select
                                            className="input-field py-4 px-6 font-bold"
                                            value={config.currency}
                                            onChange={e => setConfig({ ...config, currency: e.target.value })}
                                        >
                                            <option value="usd text-black">Dólares (USD)</option>
                                            <option value="ars text-black">Pesos (ARS)</option>
                                            <option value="eur text-black">Euros (EUR)</option>
                                        </select>
                                    </div>
                                    <div className="input-wrapper">
                                        <label className="input-label">Idioma</label>
                                        <select
                                            className="input-field py-4 px-6 font-bold"
                                            value={config.language}
                                            onChange={e => setConfig({ ...config, language: e.target.value })}
                                        >
                                            <option value="es">Español</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Logo Section */}
                            <div className="glass-card" style={{ padding: '3.5rem' }}>
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        <Camera size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black">Identidad de Marca</h2>
                                        <p className="text-secondary text-sm">Este logo aparecerá en todas tus comunicaciones.</p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-12">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative w-48 h-48 rounded-[3rem] bg-white/[0.03] border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer group hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                                    >
                                        {config.logo ? (
                                            <>
                                                <img
                                                    src={config.logo}
                                                    alt="Business logo"
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: '100%',
                                                        width: 'auto',
                                                        height: 'auto',
                                                        objectFit: 'contain'
                                                    }}
                                                    className="p-4"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[3rem] transition-all">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">Cambiar Logo</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-secondary group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                                                    <Camera size={24} />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary group-hover:text-white">Subir Logo</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleLogoChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-xl font-black">Previsualización del Logo</p>
                                            <p className="text-sm text-secondary font-medium">Recomendado: Archivo PNG transparente de 512x512px.</p>
                                        </div>
                                        <ul className="space-y-3">
                                            <li className="flex items-center gap-3 text-xs text-secondary">
                                                <Check size={14} className="text-emerald-400" />
                                                Formatos: PNG, JPG o SVG
                                            </li>
                                            <li className="flex items-center gap-3 text-xs text-secondary">
                                                <Check size={14} className="text-emerald-400" />
                                                Tamaño máximo: 5 MB
                                            </li>
                                        </ul>
                                        {config.logo && (
                                            <button
                                                onClick={() => setConfig({ ...config, logo: null })}
                                                className="text-rose-400 font-bold text-xs uppercase tracking-widest hover:text-rose-300"
                                            >
                                                Eliminar logo actual
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs */}
                    {activeTab !== 'perfil' && (
                        <div className="glass-card flex flex-col items-center justify-center text-center animate-fade-in" style={{ padding: '6rem' }}>
                            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
                                <Settings size={40} className="animate-spin-slow" />
                            </div>
                            <h2 className="text-3xl font-black mb-4">Módulo en Desarrollo</h2>
                            <p className="text-secondary max-w-md mx-auto">Esta sección de la configuración está siendo optimizada para ofrecerte el mejor control sobre tu negocio.</p>
                            <button onClick={() => setActiveTab('perfil')} className="mt-8 btn glass-button">
                                <ArrowLeft size={16} />
                                Volver a Perfil
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
