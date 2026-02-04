import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-12 max-w-md text-center animate-scale-in">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent"
            style={{ backgroundImage: 'var(--gradient-primary)' }}>
            SaaS Gestión
          </h1>
          <p className="text-secondary">
            Simplifica el cobro de cuotas mensuales
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link href="/auth/login" className="btn btn-primary">
            Iniciar Sesión
          </Link>
          <Link href="/auth/register" className="btn glass-button">
            Crear Cuenta
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-sm text-tertiary">
            ¿Tienes un gimnasio, escuela o taller?
            <br />
            Automatiza tus recordatorios de pago
          </p>
        </div>
      </div>
    </div>
  );
}
