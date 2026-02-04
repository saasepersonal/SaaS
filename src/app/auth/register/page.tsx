'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Building2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
    const router = useRouter();
    const [businessName, setBusinessName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Crear perfil de negocio inicial en la tabla business_profile
                const { error: profileError } = await supabase
                    .from('business_profile')
                    .insert([
                        {
                            id: authData.user.id,
                            business_name: businessName,
                            contact_email: email
                        }
                    ]);

                if (profileError) {
                    console.error('Error creating business profile:', profileError.message || profileError);

                    if (profileError.message?.includes('violates row-level security')) {
                        setError('No se pudo crear el perfil. Esto suele pasar si no has confirmado tu email o si la sesión no se inició. ¡Revisa tu correo o desactiva la confirmación de email en Supabase!');
                    } else {
                        setError(`Error: ${profileError.message || 'No se pudo configurar el perfil.'}`);
                    }

                    setLoading(false);
                    return;
                }

                // Guardar también en localStorage para compatibilidad inmediata con componentes existentes
                localStorage.setItem('saas_config', JSON.stringify({
                    businessName,
                    email,
                    currency: 'usd',
                    language: 'es'
                }));

                // Redirigir al dashboard con recarga total para asegurar sincronización de sesión
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md w-full animate-scale-in">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent"
                        style={{ backgroundImage: 'var(--gradient-primary)' }}>
                        SaaS Gestión
                    </h1>
                    <p className="text-secondary">Crea tu cuenta y comienza gratis</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm mb-6 animate-fade-in flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="input-wrapper">
                        <label className="input-label flex items-center gap-2">
                            <Building2 size={16} />
                            Nombre del Negocio
                        </label>
                        <input
                            type="text"
                            className="input-field w-full"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Ej: Mi Gimnasio"
                            required
                        />
                    </div>

                    <div className="input-wrapper">
                        <label className="input-label flex items-center gap-2">
                            <Mail size={16} />
                            Email
                        </label>
                        <input
                            type="email"
                            className="input-field w-full"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            required
                        />
                    </div>

                    <div className="input-wrapper">
                        <label className="input-label flex items-center gap-2">
                            <Lock size={16} />
                            Contraseña
                        </label>
                        <input
                            type="password"
                            className="input-field w-full"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary w-full ${loading ? 'opacity-50 cursor-wait' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <UserPlus size={20} />
                                Crear Cuenta
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-sm text-secondary">o</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {/* Login Link */}
                <div className="text-center">
                    <p className="text-sm text-secondary mb-3">
                        ¿Ya tienes cuenta?
                    </p>
                    <Link href="/auth/login" className="btn glass-button w-full">
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
