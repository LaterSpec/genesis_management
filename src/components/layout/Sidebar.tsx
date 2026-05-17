"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const navItems = [
  { name: "Dashboard", href: "/pages/dashboard", icon: "dashboard" },
  { name: "Clientes", href: "/pages/clients", icon: "group" },
  { name: "Inventario", href: "/pages/inventory", icon: "inventory_2" },
  { name: "Membresías", href: "/pages/memberships", icon: "card_membership" },
  { name: "Ventas", href: "/pages/sales", icon: "payments" },
  { name: "Finanzas", href: "/pages/finances", icon: "account_balance" },
  { name: "Créditos", href: "/pages/credits", icon: "credit_card" },
  { name: "Ver Registro", href: "/pages/activity_log", icon: "history" },
];


export default function Sidebar() {
  const pathname = usePathname();

  return (
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
        <form action={logout}>
          <button type="submit" className="text-on-surface/60 flex items-center gap-4 hover:text-error transition-colors w-full text-left cursor-pointer">
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </form>
      </div>
    </nav>
  );
}
