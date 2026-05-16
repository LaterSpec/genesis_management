import React from "react";
import { getActivityLogs } from "@/lib/api/logs.api";
import type { ActivityLogFull } from "@/lib/api/logs.api";

// ─── Server Component (async) ─────────────────────────────────────────────────
export default async function ActivityLogPage() {
  const { data: logs, total } = await getActivityLogs({ pageSize: 10 });

  return (
    <>
      {/* Page Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-body uppercase tracking-[0.05em] text-primary font-bold mb-2 block">
            Historial de Sistema
          </span>
          <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight">
            Registro de Actividad
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-surface-container-high text-on-surface rounded-full text-sm font-bold hover:bg-surface-variant transition-all cursor-pointer shadow-sm active:scale-95">
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
        <div className="md:col-span-5 bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
          <label className="text-xs font-label text-secondary font-bold uppercase tracking-wider mb-4 block">
            Rango de Fechas
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                calendar_today
              </span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low text-sm font-body border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-all rounded-xl text-on-surface"
                type="date"
                defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
              />
            </div>
            <span className="text-secondary/50 font-bold">-</span>
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                calendar_today
              </span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low text-sm font-body border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-all rounded-xl text-on-surface"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-7 bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm flex flex-col justify-center">
          <label className="text-xs font-label text-secondary font-bold uppercase tracking-wider mb-4 block">
            Filtrar por Tipo de Acción
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterChip label="Todas" active={true} />
            <FilterChip label="Accesos" />
            <FilterChip label="Ventas" />
            <FilterChip label="Créditos" />
            <FilterChip label="Inventario" />
          </div>
        </div>
      </div>

      {/* Data Table Canvas */}
      <div className="bg-surface-container-lowest rounded-[2.5rem] overflow-hidden border border-outline-variant/10 shadow-sm relative mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-5 px-8 font-label text-[10px] font-black text-secondary uppercase tracking-widest">
                  Fecha/Hora
                </th>
                <th className="py-5 px-8 font-label text-[10px] font-black text-secondary uppercase tracking-widest">
                  Usuario / Cliente
                </th>
                <th className="py-5 px-8 font-label text-[10px] font-black text-secondary uppercase tracking-widest">
                  Acción Realizada
                </th>
                <th className="py-5 px-8 font-label text-[10px] font-black text-secondary uppercase tracking-widest">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="font-body text-sm divide-y divide-outline-variant/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-on-surface/40 font-body text-sm">
                    No hay registros de actividad.
                  </td>
                </tr>
              ) : (
                logs.map((log) => <LogEntry key={log.id} log={log} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="py-6 px-8 border-t border-outline-variant/10 flex items-center justify-between bg-surface-container-low/30">
          <span className="text-sm text-secondary font-medium">
            Mostrando 1 a {logs.length} de {total} registros
          </span>
          <div className="flex gap-2">
            <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-30">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 rounded-full bg-primary text-white font-bold text-sm shadow-md shadow-primary/20">
              1
            </button>
            <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors cursor-pointer">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Sub-componentes puros ─────────────────────────────────────────────────────
function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`px-5 py-2 rounded-full text-sm font-bold transition-all cursor-pointer border ${
        active
          ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
          : "bg-surface-container text-secondary border-transparent hover:border-outline-variant/30"
      }`}
    >
      {label}
    </button>
  );
}

const ACTION_STYLES: Record<string, { icon: string; className: string; label: string }> = {
  SALE_CREATED:       { icon: "payments",    className: "bg-secondary-container/50 text-on-secondary-container", label: "Venta" },
  ACCESS_GRANTED:     { icon: "login",       className: "bg-primary-container/20 text-primary",                  label: "Acceso Permitido" },
  ACCESS_DENIED:      { icon: "block",       className: "bg-error-container text-on-error-container",            label: "Acceso Denegado" },
  STOCK_ADJUSTMENT:   { icon: "inventory_2", className: "bg-tertiary-container/20 text-tertiary",                label: "Ajuste Stock" },
  MEMBERSHIP_CREATED: { icon: "card_membership", className: "bg-primary-container/20 text-primary",             label: "Membresía" },
  CREDIT_ADDED:       { icon: "credit_card", className: "bg-secondary-container/50 text-on-secondary-container", label: "Crédito" },
  CREDIT_PAID:        { icon: "payments",    className: "bg-primary-container/20 text-primary",                  label: "Pago" },
};

function LogEntry({ log }: { log: ActivityLogFull }) {
  const style = ACTION_STYLES[log.action_type] ?? {
    icon: "info",
    className: "bg-surface-container text-on-surface",
    label: log.action_type,
  };

  const actorName = log.clients
    ? `${log.clients.first_name} ${log.clients.last_name}`
    : log.profiles
    ? `${log.profiles.first_name} ${log.profiles.last_name}`
    : "Sistema";

  const refInfo = log.clients
    ? `ID: ${log.client_id}`
    : undefined;

  const initials = actorName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const date = new Date(log.created_at).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const time = new Date(log.created_at).toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  return (
    <tr className="group hover:bg-surface-container-low transition-all duration-300">
      <td className="py-6 px-8 whitespace-nowrap">
        <div className="font-bold text-on-surface">{date}</div>
        <div className="text-xs text-secondary font-medium">{time}</div>
      </td>
      <td className="py-6 px-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {initials}
          </div>
          <div>
            <div className="font-bold text-on-surface group-hover:text-primary transition-colors">
              {actorName}
            </div>
            {refInfo && (
              <div className="text-xs text-secondary font-medium">{refInfo}</div>
            )}
          </div>
        </div>
      </td>
      <td className="py-6 px-8">
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${style.className} shadow-sm`}
        >
          <span className="material-symbols-outlined text-[14px]">{style.icon}</span>
          {style.label}
        </span>
      </td>
      <td className="py-6 px-8 text-on-surface-variant font-medium">{log.description}</td>
    </tr>
  );
}
