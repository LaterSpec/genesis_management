"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopAppBar from "./TopAppBar";
import { useCashSession } from "./CashSessionContext";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/login");

  const { activeSession, userProfile, loading, openSession } = useCashSession();
  const [initialAmount, setInitialAmount] = useState<string>("0");
  const [isOpening, setIsOpening] = useState(false);

  if (isAuthRoute) {
    return <main className="flex-1 flex flex-col min-h-screen relative">{children}</main>;
  }

  // Si está cargando el estado del usuario/caja, mostramos un spinner prémium
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-surface">
        <span className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></span>
      </div>
    );
  }

  // El bloqueo de caja es exclusivo para recepcionistas (el admin está exceptuado)
  const showOpeningOverlay = userProfile?.role === "receptionist" && !activeSession;

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsOpening(true);
      const amount = parseFloat(initialAmount) || 0;
      await openSession(amount);
    } catch (err) {
      console.error("Error al abrir caja:", err);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <>
      <Sidebar />
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen relative">
        <TopAppBar />
        <div className="p-8 space-y-8 flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* OVERLAY BLOQUEANTE DE APERTURA DE CAJA PARA RECEPCIONISTAS */}
      {showOpeningOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-surface/80 backdrop-blur-xl transition-all duration-500">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-container/30 blur-[120px] pointer-events-none"></div>

          <div className="w-full max-w-md bg-surface-container-high/80 border border-outline-variant/30 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative transform transition-all duration-300 scale-100 hover:shadow-primary/5">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-container/30 text-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <span className="material-symbols-outlined text-3xl">point_of_sale</span>
              </div>
              <h2 className="font-headline font-black text-3xl text-on-surface mb-2">
                ¡Bienvenido, {userProfile?.first_name}!
              </h2>
              <p className="text-on-surface-variant font-body text-sm">
                Inicia tu sesión de caja para comenzar tu turno.
              </p>
            </div>

            <div className="bg-surface-container-low/50 border border-outline-variant/20 rounded-2xl p-4 mb-6 text-center">
              <p className="font-body text-xs font-semibold text-secondary uppercase tracking-widest mb-1">
                Hora de Apertura
              </p>
              <p className="font-headline text-base font-bold text-on-surface">
                {new Date().toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="font-headline text-2xl font-black text-primary mt-1">
                {new Date().toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <form onSubmit={handleOpenCash} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  Monto Inicial en Caja (S/)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-sm font-semibold text-on-surface-variant/70">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant/70 font-body">
                  Ingresa el efectivo disponible en caja física al momento de abrir el turno.
                </p>
              </div>

              <button
                type="submit"
                disabled={isOpening}
                className="w-full bg-gradient-cta text-white font-bold rounded-xl py-3.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isOpening ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Abriendo Caja...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">vpn_key</span>
                    <span>Abrir Turno y Caja</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
