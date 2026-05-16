import React from "react";
import { getClientStats } from "@/lib/api/clients.api";
import { getInventoryStats } from "@/lib/api/inventory.api";
import { getMonthlySalesTotal } from "@/lib/api/sales.api";
import { getCreditPortfolioTotal } from "@/lib/api/clients.api";
import { getRecentActivityLogs } from "@/lib/api/logs.api";
import { getDailyFinancialData } from "@/lib/api/finances.api";
import type { ActivityLogFull } from "@/lib/api/logs.api";

// ─── Server Component (async) ─────────────────────────────────────────────────
export default async function DashboardPage() {
  const [clientStats, inventoryStats, monthlySales, creditTotal, recentLogs, weeklyData] =
    await Promise.all([
      getClientStats(),
      getInventoryStats(),
      getMonthlySalesTotal(),
      getCreditPortfolioTotal(),
      getRecentActivityLogs(5),
      getDailyFinancialData(7),
    ]);

  // Normalizar barras del gráfico a porcentaje relativo (max = 100%)
  const maxIncome = Math.max(...weeklyData.map((d) => d.income), 1);

  return (
    <>
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-on-surface mb-1">
            Resumen General
          </h2>
          <p className="font-body text-secondary text-sm">
            Vista rápida del rendimiento de hoy.
          </p>
        </div>
        <div className="text-right">
          <p className="font-body text-xs font-semibold text-secondary uppercase tracking-widest mb-1">
            Última actualización
          </p>
          <p className="font-headline text-lg font-bold text-on-surface">
            {new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Clientes */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl relative overflow-hidden group shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <p className="font-body text-xs font-semibold text-secondary uppercase tracking-widest">
              Total Clientes
            </p>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              group
            </span>
          </div>
          <h3 className="font-headline font-extrabold text-4xl text-on-surface relative z-10">
            {clientStats.totalActive.toLocaleString("es-MX")}
          </h3>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
            <span className="text-sm font-semibold text-primary">
              +{clientStats.newThisMonth} este mes
            </span>
          </div>
        </div>

        {/* Ventas del Mes */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl relative overflow-hidden group shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <p className="font-body text-xs font-semibold text-secondary uppercase tracking-widest">
              Ventas del Mes
            </p>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              payments
            </span>
          </div>
          <h3 className="font-headline font-extrabold text-4xl text-on-surface relative z-10">
            ${monthlySales >= 1000
              ? `${(monthlySales / 1000).toFixed(1)}K`
              : monthlySales.toFixed(0)}
          </h3>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
            <span className="text-sm font-semibold text-primary">Este mes</span>
          </div>
        </div>

        {/* Créditos Pendientes */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl relative overflow-hidden group shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-error-container/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <p className="font-body text-xs font-semibold text-secondary uppercase tracking-widest">
              Créditos Pendientes
            </p>
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
              credit_card
            </span>
          </div>
          <h3 className="font-headline font-extrabold text-4xl text-on-surface relative z-10">
            ${creditTotal.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
          </h3>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="text-sm font-semibold text-error">Cartera activa de deudas</span>
          </div>
        </div>

        {/* Bajo Stock */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl relative overflow-hidden group shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary-container/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <p className="font-body text-xs font-semibold text-secondary uppercase tracking-widest">
              Bajo Stock
            </p>
            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
              inventory_2
            </span>
          </div>
          <h3 className="font-headline font-extrabold text-4xl text-on-surface relative z-10">
            {inventoryStats.criticalStock}
          </h3>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="text-sm font-semibold text-secondary">Artículos requieren revisión</span>
          </div>
        </div>
      </div>

      {/* Layout Grid: Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-8 relative shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-headline font-bold text-xl text-on-surface">
                Ingresos Semanales
              </h3>
              <p className="font-body text-sm text-secondary">Últimos 7 días</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 flex items-end justify-between gap-4 w-full border-b border-outline-variant/20 pb-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
              <div className="border-b border-on-surface h-0"></div>
              <div className="border-b border-on-surface h-0"></div>
              <div className="border-b border-on-surface h-0"></div>
              <div className="border-b border-on-surface h-0"></div>
            </div>
            {weeklyData.map((day, i) => {
              const heightPct = Math.round((day.income / maxIncome) * 100);
              const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short" });
              return (
                <div
                  key={i}
                  className={`w-full rounded-t-md relative group transition-all duration-500 ease-in-out ${
                    heightPct > 80
                      ? "bg-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "bg-primary-container/40"
                  }`}
                  style={{ height: `${heightPct}%` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {dayLabel} · ${day.income.toFixed(0)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-secondary font-medium px-2">
            {weeklyData.map((day, i) => (
              <span key={i}>
                {new Date(day.date + "T12:00:00").toLocaleDateString("es-MX", { weekday: "narrow" })}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline font-bold text-xl text-on-surface">
              Actividad Reciente
            </h3>
          </div>
          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-on-surface/40 font-body text-center py-4">Sin actividad reciente.</p>
            ) : (
              recentLogs.map((log) => (
                <ActivityItem key={log.id} log={log} />
              ))
            )}
          </div>
          <button className="w-full mt-6 py-3 text-sm font-semibold text-primary hover:bg-primary-container/10 rounded-xl transition-colors cursor-pointer">
            Ver todo el registro
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Sub-componente puro ───────────────────────────────────────────────────────
function ActivityItem({ log }: { log: ActivityLogFull }) {
  const isError = log.is_error;
  const clientName = log.clients
    ? `${log.clients.first_name} ${log.clients.last_name}`
    : log.profiles
    ? `${log.profiles.first_name} ${log.profiles.last_name}`
    : "Sistema";

  const iconMap: Record<string, string> = {
    ACCESS_GRANTED: "login",
    ACCESS_DENIED: "block",
    SALE_CREATED: "shopping_cart",
    MEMBERSHIP_CREATED: "card_membership",
    STOCK_ADJUSTMENT: "inventory_2",
    CREDIT_ADDED: "credit_card",
    CREDIT_PAID: "payments",
  };
  const icon = iconMap[log.action_type] ?? "info";
  const time = new Date(log.created_at).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group flex items-start gap-4 p-3 rounded-xl hover:bg-surface-container-high transition-colors relative cursor-pointer">
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-r opacity-0 group-hover:opacity-100 transition-opacity ${
          isError ? "bg-error" : "bg-primary"
        }`}
      ></div>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isError ? "bg-error-container text-error" : "bg-primary-container/20 text-primary"
        }`}
      >
        <span className="material-symbols-outlined text-sm">{icon}</span>
      </div>
      <div>
        <p className="font-body text-sm font-semibold text-on-surface">{clientName}</p>
        <p className="font-body text-xs text-secondary">{log.description}</p>
      </div>
      <span className="ml-auto text-xs text-secondary font-medium">{time}</span>
    </div>
  );
}
