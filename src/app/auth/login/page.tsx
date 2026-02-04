'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            console.log('Intentando login para:', email);
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (loginError) {
                console.error('Error de login capturado:', loginError);
                setError(loginError.message === 'Invalid login credentials'
                    ? 'Credenciales incorrectas. Si es tu primera vez tras la migración, por favor crea una cuenta nueva.'
                    : loginError.message);
                return;
            }

            if (data.user) {
                console.log('Login exitoso, redirigiendo a dashboard...', data.user);
                // Usamos location.href para asegurar que el Middleware detecte la nueva cookie de sesión
                window.location.href = '/dashboard';
            } else {
                console.warn('Login parece exitoso pero no hay datos de usuario.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
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
                    <p className="text-secondary">Inicia sesión en tu cuenta</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm mb-6 animate-fade-in flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
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
                            placeholder="••••••••"
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
                                <LogIn size={20} />
                                Iniciar Sesión
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

                {/* Register Link */}
                <div className="text-center">
                    <p className="text-sm text-secondary mb-3">
                        ¿No tienes cuenta?
                    </p>
                    <Link href="/auth/register" className="btn glass-button w-full">
                        Crear Cuenta Nueva
                    </Link>
                </div>
            </div>
        </div>
    );
}
