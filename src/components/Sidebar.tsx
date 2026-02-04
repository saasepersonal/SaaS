'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Settings,
    Bell,
    LogOut,
    ChevronRight
} from 'lucide-react';

const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
    { href: '/dashboard/clientes', icon: Users, label: 'Clientes' },
    { href: '/dashboard/pagos', icon: CreditCard, label: 'Pagos' },
    { href: '/dashboard/recordatorios', icon: Bell, label: 'Recordatorios' },
    { href: '/dashboard/configuracion', icon: Settings, label: 'Configuración' },
];

import { supabase } from '@/lib/supabase';

export default function Sidebar() {
    const pathname = usePathname();
    const [businessName, setBusinessName] = useState('SaaS Gestión');
    const [logo, setLogo] = useState<string | null>(null);

    // Cargar nombre del negocio y logo (Prioriza Supabase, cae en localStorage o Default)
    const loadConfig = async () => {
        // 1. Intentar cargar de Supabase si hay sesión
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('business_profile')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                if (profile.business_name) setBusinessName(profile.business_name);
                if (profile.logo_url) setLogo(profile.logo_url);
                return;
            }
        }

        // 2. Fallback a localStorage si falla Supabase o no hay sesión aún
        const savedConfig = localStorage.getItem('saas_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                if (config.businessName) setBusinessName(config.businessName);
                if (config.logo) setLogo(config.logo);
            } catch (e) {
                console.error('Error al cargar config local en Sidebar:', e);
            }
        }
    };

    useEffect(() => {
        loadConfig();
        // Escuchar cambios guardados localmente para reactividad instantánea al guardar en config
        window.addEventListener('configUpdated', loadConfig);
        return () => window.removeEventListener('configUpdated', loadConfig);
    }, []);

    return (
        <aside className="w-72 min-h-screen border-r border-white/5 flex flex-col relative z-20">
            {/* Logo Section */}
            <div className="p-8 mb-4">
                <div className="flex items-center gap-3">
                    <div
                        style={{
                            width: '48px',
                            height: '48px',
                            minWidth: '48px',
                            maxWidth: '48px',
                            minHeight: '48px',
                            maxHeight: '48px',
                            position: 'relative'
                        }}
                        className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 overflow-hidden border border-white/10"
                    >
                        {logo ? (
                            <img
                                src={logo}
                                alt="Logo"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    display: 'block',
                                    objectFit: 'contain'
                                }}
                                className="p-1"
                            />
                        ) : (
                            <span className="text-xl font-black text-white">{businessName.charAt(0)}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold tracking-tight text-white truncate">{businessName}</h1>
                        <p className="text-[10px] uppercase tracking-widest text-secondary font-bold truncate">Premium Edition</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300
                                ${isActive
                                    ? 'bg-white/5 border border-white/10 shadow-xl'
                                    : 'hover:bg-white/[0.02] text-secondary hover:text-white'
                                }
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`
                                    p-2 rounded-lg transition-colors
                                    ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/5 text-secondary group-hover:text-white'}
                                `}>
                                    <Icon size={18} />
                                </div>
                                <span className={`font-semibold text-sm transition-colors ${isActive ? 'text-white' : ''}`}>
                                    {item.label}
                                </span>
                            </div>
                            {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile Hook */}
            <div className="p-6">
                <div className="glass-card p-4 flex items-center gap-3 border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center font-bold text-white shadow-lg">
                            {businessName.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#050508] rounded-full" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-sm truncate text-white">{businessName}</p>
                        <p className="text-xs text-secondary truncate">Plan Enterprise</p>
                    </div>
                    <LogOut size={16} className="text-secondary group-hover:text-rose-400 transition-colors" />
                </div>
            </div>
        </aside>
    );
}
