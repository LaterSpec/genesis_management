"use client";

import { login } from "./actions";

export default function LoginPage() {

  return (
    <div className="flex w-full min-h-screen overflow-hidden bg-surface relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-container/30 blur-[120px] pointer-events-none"></div>

      {/* Left side: branding/imagery (hidden on mobile) */}
      <div className="hidden md:flex flex-1 flex-col justify-center items-start p-16 relative overflow-hidden bg-gradient-cta z-10 min-h-screen">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
        <div className="relative z-10 text-white max-w-lg">
          <h1 className="font-headline font-black text-6xl mb-6 leading-tight drop-shadow-lg">
            Desata Tu<br />Máximo<br />Potencial.
          </h1>
          <p className="font-body text-lg opacity-90 leading-relaxed mb-8">
            El sistema de gestión de alto rendimiento diseñado exclusivamente para GenesisGym. Control total, métricas precisas y resultados extraordinarios.
          </p>
          <div className="flex items-center gap-4 text-sm font-semibold tracking-wider uppercase opacity-80">
            <span className="material-symbols-outlined text-3xl">fitness_center</span>
            GenesisGym Management
          </div>
        </div>
      </div>

      {/* Right side: Forms */}
      <div className="flex-1 flex items-center justify-center p-8 z-10 min-h-screen my-auto">
        <div className="w-full max-w-md bg-surface/80 backdrop-blur-3xl rounded-3xl p-8 border border-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] relative transition-all duration-500 ease-out transform" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          
          <div className="text-center mb-8">
            <h2 className="font-headline font-black text-3xl text-on-surface mb-2">
              Bienvenido de vuelta
            </h2>
            <p className="text-on-surface-variant font-body text-sm">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form action={login} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</label>
              <input name="email" required type="email" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="admin@genesisgym.com" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Contraseña</label>
              <input name="password" required type="password" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="••••••••" />
            </div>

            <button type="submit" className="w-full bg-gradient-cta text-white font-bold rounded-xl py-3.5 mt-2 shadow-[0_10px_20px_-10px_var(--color-primary)] hover:shadow-[0_10px_25px_-5px_var(--color-primary)] hover:-translate-y-0.5 transition-all duration-300">
              Iniciar Sesión
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
