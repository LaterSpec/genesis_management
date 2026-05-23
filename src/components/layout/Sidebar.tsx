"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutOnlyAction } from "@/app/login/actions";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useCashSession } from "./CashSessionContext";

const baseNavItems = [
  { name: "Dashboard", href: "/pages/dashboard", icon: "dashboard" },
  { name: "Clientes", href: "/pages/clients", icon: "group" },
  { name: "Asistencias", href: "/pages/attendances", icon: "fact_check" },
  { name: "Inventario", href: "/pages/inventory", icon: "inventory_2" },
  { name: "Membresías", href: "/pages/memberships", icon: "card_membership" },
  { name: "Ventas", href: "/pages/sales", icon: "payments" },
  { name: "Finanzas", href: "/pages/finances", icon: "account_balance" },
  { name: "Créditos", href: "/pages/credits", icon: "credit_card" },
  { name: "Ver Registro", href: "/pages/activity_log", icon: "history" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const { activeSession, userProfile, closeSession } = useCashSession();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile?.role === "administrator") {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error("Error checking role in sidebar:", err);
      }
    }
    checkRole();
  }, []);

  const navItems = isAdmin 
    ? [...baseNavItems, { name: "Personal", href: "/pages/staff", icon: "badge" }]
    : baseNavItems;

  // Hard logout: cierra sesión en servidor y fuerza un hard reload del navegador.
  // Esto destruye completamente el árbol de React, el contexto y el router cache de Next.js,
  // evitando que datos del usuario anterior queden en memoria.
  const performHardLogout = async () => {
    try {
      await supabase.auth.signOut();
      await signOutOnlyAction();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      window.location.assign("/login");
    }
  };

  const handleLogoutClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Si es recepcionista y tiene sesión de caja activa, mostramos confirmación
    if (userProfile?.role === "receptionist" && activeSession) {
      setShowCloseConfirm(true);
    } else {
      await performHardLogout();
    }
  };

  const handleConfirmClose = async () => {
    try {
      setIsClosing(true);
      await closeSession(); // Cierra el turno en base de datos
      await performHardLogout(); // Hard logout + hard reload
    } catch (err) {
      console.error("Error al cerrar turno y sesión:", err);
      setIsClosing(false);
    }
  };

  return (
    <>
      <nav className="fixed left-0 top-0 h-full w-72 bg-surface flex-col border-r border-outline-variant/20 hidden md:flex z-50">
        <div className="p-8">
          <h1 className="font-headline font-black text-2xl text-on-surface mb-2">GenesisGym</h1>
          <p className="font-body text-sm tracking-wide text-on-surface/60">Alto Rendimiento</p>
        </div>

        <div className="px-6 mb-8">
          <Link href="/pages/sales">
            <button className="w-full bg-gradient-cta text-white rounded-full py-3 font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer">
              Nueva Venta
            </button>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto font-body text-sm tracking-wide flex flex-col">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-6 py-3 flex items-center gap-4 transition-all mb-2 ${
                  isActive
                    ? "bg-primary-container/10 text-primary font-bold border-l-4 border-primary"
                    : "text-on-surface/60 hover:bg-surface-container hover:text-primary border-l-4 border-transparent"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-6 mt-auto">
          <button
            type="button"
            onClick={handleLogoutClick}
            className="text-on-surface/60 flex items-center gap-4 hover:text-error transition-colors w-full text-left cursor-pointer"
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* MODAL DE CONFIRMACIÓN DE CIERRE DE CAJA */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-md bg-surface-container-high border border-outline-variant/30 rounded-3xl p-8 shadow-2xl scale-100 transition-all duration-300 mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-error-container/20 text-error rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="material-symbols-outlined text-3xl">logout</span>
              </div>
              <h3 className="font-headline font-black text-2xl text-on-surface mb-2">
                Confirmar Cierre de Caja
              </h3>
              <p className="text-on-surface-variant font-body text-sm">
                Estás a punto de cerrar tu sesión de usuario. Esto registrará automáticamente el cierre de tu turno y tu caja física actual.
              </p>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-body text-xs font-semibold text-secondary uppercase tracking-widest">
                  Usuario
                </span>
                <span className="font-body text-sm font-bold text-on-surface">
                  {userProfile?.first_name} {userProfile?.last_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-xs font-semibold text-secondary uppercase tracking-widest">
                  Caja Abierta
                </span>
                <span className="font-body text-xs font-bold text-primary bg-primary-container/10 px-2 py-0.5 rounded-full">
                  ACTIVA
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                disabled={isClosing}
                className="flex-1 bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold rounded-xl py-3 border border-outline-variant/30 transition-colors text-sm cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={isClosing}
                className="flex-1 bg-error hover:bg-error-container text-white font-bold rounded-xl py-3 shadow-lg shadow-error/20 hover:shadow-error/30 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isClosing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Cerrando...</span>
                  </>
                ) : (
                  <span>Cerrar Caja y Salir</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

