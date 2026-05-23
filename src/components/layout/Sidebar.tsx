"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useCashSession } from "./CashSessionContext";
import { useTheme } from "@/components/ThemeProvider";
import { signOutOnlyAction } from "@/app/login/actions";

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
  const supabase = createClient();

  // Estados de caja, sesión y tema
  const { activeSession, userProfile, closeSession } = useCashSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    setDropdownOpen(false);
    if (userProfile?.role === "receptionist" && activeSession) {
      setShowCloseConfirm(true);
    } else {
      await performHardLogout();
    }
  };

  const handleConfirmClose = async () => {
    try {
      setIsClosing(true);
      await closeSession();
      await performHardLogout();
    } catch (err) {
      console.error("Error al cerrar turno y sesión:", err);
      setIsClosing(false);
    }
  };

  const navItems = isAdmin 
    ? [...baseNavItems, { name: "Personal", href: "/pages/staff", icon: "badge" }]
    : baseNavItems;

  return (
    <>
      <nav className="fixed left-0 top-0 h-full w-72 bg-surface flex flex-col border-r border-outline-variant/20 hidden md:flex z-50">
        {/* Cabecera simplificada sin subtítulo */}
        <div className="p-8 pb-4">
          <h1 className="font-headline font-black text-2xl text-on-surface">GenesisGym</h1>
        </div>

        {/* Sección de navegación flexible con scroll si es necesario */}
        <div className="flex-1 overflow-y-auto font-body text-sm tracking-wide flex flex-col pb-6">
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

        {/* Sección de Perfil en la parte inferior del Sidebar */}
        {userProfile && (
          <div className="p-4 border-t border-outline-variant/20 bg-surface relative">
            {dropdownOpen && (
              <>
                {/* Overlay invisible para cerrar el desplegable */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                
                {/* Dropup flotante adaptado al ancho del Sidebar */}
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-surface-container-high border border-outline-variant/30 rounded-2xl p-4 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {/* Info de Perfil */}
                  <div className="pb-3 border-b border-outline-variant/20 mb-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-sm shrink-0">
                      {userProfile.first_name[0]}{userProfile.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-on-surface truncate">
                        {userProfile.first_name} {userProfile.last_name}
                      </p>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">
                        {userProfile.role === "administrator" ? "Administrador" : "Recepcionista"}
                      </p>
                    </div>
                  </div>

                  {/* Opción de Cambio de Tema */}
                  <button
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface/70 hover:bg-primary-container/10 hover:text-primary transition-all cursor-pointer text-left mb-1"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px]">
                        {mounted && resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
                      </span>
                      <span>Tema {mounted && resolvedTheme === "dark" ? "Claro" : "Oscuro"}</span>
                    </div>
                    <span className="text-[10px] text-on-surface/40 uppercase font-bold tracking-wider">
                      {mounted && resolvedTheme === "dark" ? "Oscuro" : "Claro"}
                    </span>
                  </button>

                  {/* Opción de Cerrar Sesión */}
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-on-surface/70 hover:bg-error-container/10 hover:text-error transition-all cursor-pointer text-left"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </>
            )}

            {/* Botón de Perfil */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between bg-surface-container-low hover:bg-surface-container-high p-3 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-all cursor-pointer select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                  {userProfile.first_name[0]}{userProfile.last_name[0]}
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-sm font-semibold text-on-surface leading-none truncate">
                    {userProfile.first_name} {userProfile.last_name}
                  </span>
                  <span className="text-[9px] text-on-surface/50 font-bold uppercase tracking-wider mt-1">
                    {userProfile.role === "administrator" ? "Administrador" : "Recepcionista"}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] transition-transform duration-200 shrink-0" style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                expand_less
              </span>
            </button>
          </div>
        )}
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
