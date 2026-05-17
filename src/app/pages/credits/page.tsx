import React from "react";
import { getActiveCredits, getCreditPortfolioTotal } from "@/lib/api/clients.api";
import type { ClientCreditWithClient } from "@/lib/api/clients.api";

// ─── Server Component (async) ─────────────────────────────────────────────────
export default async function CreditsPage() {
  const [credits, portfolioTotal] = await Promise.all([
    getActiveCredits(),
    getCreditPortfolioTotal(),
  ]);

  const overdue = credits.filter((c) => c.balance >= 500);
  const overdueTotal = overdue.reduce((sum, c) => sum + c.balance, 0);

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <p className="font-label text-xs uppercase tracking-[0.1em] text-primary font-bold mb-2">
            Gestión Financiera
          </p>
          <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">
            Créditos y Deudas
          </h2>
        </div>
      </div>

      {/* Bento Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        {/* Major Metric */}
        <div className="col-span-1 md:col-span-8 bg-surface-container-low rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-sm border border-outline-variant/10 group">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-container/10 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="font-label text-sm text-secondary font-medium uppercase tracking-wider">
                Cartera Total Activa
              </p>
              <h3 className="font-headline text-5xl md:text-6xl font-black text-on-surface mt-4 tracking-tighter">
                ${portfolioTotal.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                <span className="text-2xl text-secondary font-semibold">.00</span>
              </h3>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
            </div>
          </div>
          <p className="font-body text-sm text-secondary font-bold mt-8 flex items-center gap-1 relative z-10">
            {credits.length} cuentas con balance pendiente
          </p>
        </div>

        {/* Critical Metric */}
        <div className="col-span-1 md:col-span-4 bg-error-container/20 rounded-3xl p-8 flex flex-col justify-between border border-error-container shadow-sm group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="font-label text-sm text-error/70 font-bold uppercase tracking-wider">
                Deuda Crítica
              </p>
              <h3 className="font-headline text-4xl font-black text-on-error-container mt-4 tracking-tight">
                ${overdueTotal.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-error">warning</span>
            </div>
          </div>
          <p className="font-body text-sm text-on-error-container/80 mt-8 font-medium relative z-10">
            {overdue.length > 0
              ? `Requiere atención inmediata (${overdue.length} clientes)`
              : "Sin deudas críticas en este momento"}
          </p>
        </div>
      </div>

      {/* Interactive List Container */}
      <div className="bg-surface-container-low rounded-[2.5rem] p-4 shadow-sm border border-outline-variant/10 relative z-10">
        <div className="px-8 py-8 flex justify-between items-center">
          <h3 className="font-headline text-2xl font-bold text-on-surface">Estado de Cuentas</h3>
          <div className="flex gap-3">
            <button className="bg-surface-container-high hover:bg-surface-variant text-on-surface px-6 py-2.5 rounded-full font-label font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filtrar
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-10 py-4 mb-2 font-label text-xs uppercase tracking-widest text-secondary font-black">
            <div className="col-span-5 md:col-span-4">Cliente</div>
            <div className="col-span-3 md:col-span-3 text-right">Monto Total</div>
            <div className="hidden md:block col-span-2">Última Actualización</div>
            <div className="col-span-4 md:col-span-1 text-center">Estado</div>
            <div className="hidden md:block col-span-2"></div>
          </div>

          {credits.length === 0 ? (
            <p className="py-12 text-center text-on-surface/40 font-body text-sm">
              No hay cuentas con balance pendiente.
            </p>
          ) : (
            credits.map((credit) => (
              <CreditRow key={credit.id} credit={credit} />
            ))
          )}
        </div>

        <div className="px-10 mt-8 pt-8 flex items-center justify-between border-t border-outline-variant/10">
          <p className="font-body text-sm text-secondary font-medium">
            Mostrando {credits.length} resultado{credits.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Sub-componente puro ───────────────────────────────────────────────────────
function CreditRow({ credit }: { credit: ClientCreditWithClient }) {
  const isCritical = credit.balance >= 500;
  const clientName = `${credit.clients.first_name} ${credit.clients.last_name}`;
  const initials = `${credit.clients.first_name[0]}${credit.clients.last_name[0]}`.toUpperCase();
  const lastUpdated = new Date(credit.last_updated).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className="group relative grid grid-cols-12 gap-4 items-center px-10 py-6 hover:bg-surface-container-low transition-all duration-300 rounded-3xl mx-2 cursor-pointer border-b border-outline-variant/5 last:border-0">
      <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity ${isCritical ? "bg-error" : "bg-primary"}`}></div>

      {/* Cliente */}
      <div className="col-span-5 md:col-span-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold text-sm">
          {initials}
        </div>
        <div>
          <p className="font-body font-bold text-base text-on-surface group-hover:text-primary transition-colors">
            {clientName}
          </p>
          <p className="font-label text-xs text-secondary font-medium">{credit.clients.email ?? "—"}</p>
        </div>
      </div>

      {/* Monto */}
      <div className="col-span-3 md:col-span-3 text-right">
        <p className="font-headline font-bold text-xl text-on-surface">
          ${credit.balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Última Actualización */}
      <div className="hidden md:block col-span-2">
        <p className={`font-body text-sm font-bold ${isCritical ? "text-error" : "text-on-surface"}`}>
          {lastUpdated}
        </p>
      </div>

      {/* Estado */}
      <div className="col-span-4 md:col-span-1 flex justify-center">
        <span
          className={`font-label text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap shadow-sm ${
            isCritical
              ? "bg-error-container text-on-error-container"
              : "bg-secondary-container text-on-secondary-container"
          }`}
        >
          {isCritical ? "Vencido" : "Pendiente"}
        </span>
      </div>

      {/* Acción */}
      <div className="hidden md:flex col-span-2 justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <button className="bg-primary text-white hover:bg-primary-container hover:text-white px-6 py-2.5 rounded-full font-label font-bold text-xs transition-all shadow-md shadow-primary/20 cursor-pointer">
          Abonar
        </button>
      </div>
    </div>
  );
}
