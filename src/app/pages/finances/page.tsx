import React from "react";
import { getTransactions, getFinancialSummary, getDailyFinancialData } from "@/lib/api/finances.api";
import type { FinancialTransaction } from "@/lib/database.types";

// ─── Server Component (async) ─────────────────────────────────────────────────
export default async function FinancesPage() {
  const [summary, transactions, weeklyData] = await Promise.all([
    getFinancialSummary(),
    getTransactions({ limit: 10 }),
    getDailyFinancialData(7),
  ]);

  // Normalizar alturas del gráfico
  const maxValue = Math.max(...weeklyData.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <>
      {/* Page Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
        <div>
          <h2 className="font-headline font-bold text-4xl text-on-surface tracking-tight">
            Flujo de Caja
          </h2>
          <p className="font-body text-on-surface-variant mt-2">
            Resumen financiero y transacciones recientes.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-full border border-outline-variant/10">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">
              calendar_month
            </span>
            <select className="bg-transparent border-none text-sm font-body font-medium text-on-surface pl-10 pr-8 py-2 focus:ring-0 appearance-none cursor-pointer outline-none">
              <option>Últimos 7 días</option>
              <option>Este mes</option>
              <option>Mes anterior</option>
            </select>
          </div>
          <div className="w-[1px] h-6 bg-outline-variant/30"></div>
          <button className="bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-full px-6 py-2 text-sm font-body font-semibold transition-colors cursor-pointer">
            Exportar
          </button>
        </div>
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Total Ingresos */}
        <div className="bg-surface-container-low rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group shadow-sm border border-outline-variant/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <span className="font-body text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold">
              Ingresos Totales
            </span>
            <div className="bg-primary-container/20 text-primary p-2 rounded-full">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                trending_up
              </span>
            </div>
          </div>
          <div className="relative z-10">
            <span className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter block mb-2">
              ${summary.totalIncome.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Total Egresos */}
        <div className="bg-surface-container-low rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group shadow-sm border border-outline-variant/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-error-container/20 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <span className="font-body text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold">
              Egresos Totales
            </span>
            <div className="bg-error-container/50 text-error p-2 rounded-full">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                trending_down
              </span>
            </div>
          </div>
          <div className="relative z-10">
            <span className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter block mb-2">
              ${summary.totalExpense.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Balance Neto */}
        <div className="bg-gradient-cta text-white rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <span className="font-body text-[11px] uppercase tracking-widest text-white/70 font-semibold">
              Balance Neto
            </span>
            <div className="bg-white/10 p-2 rounded-full">
              <span className="material-symbols-outlined text-sm text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
            </div>
          </div>
          <div className="relative z-10">
            <span className="font-headline font-extrabold text-5xl tracking-tighter block mb-2">
              ${summary.netBalance.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
            </span>
            <span className="font-body text-sm text-white/80 font-medium">
              {summary.netBalance > 0 ? "Margen operativo positivo" : "Balance negativo"}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface-container-low rounded-[2.5rem] p-10 shadow-sm border border-outline-variant/10 mb-12">
        <div className="flex items-center justify-between mb-10">
          <h3 className="font-headline font-bold text-2xl text-on-surface">Ingresos vs Egresos</h3>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="font-body text-sm text-on-surface-variant font-medium">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error"></div>
              <span className="font-body text-sm text-on-surface-variant font-medium">Egresos</span>
            </div>
          </div>
        </div>

        <div className="h-72 flex items-end justify-between gap-4 px-6 relative border-b border-outline-variant/20 pb-6">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 py-6">
            <div className="border-b border-on-surface w-full"></div>
            <div className="border-b border-on-surface w-full"></div>
            <div className="border-b border-on-surface w-full"></div>
            <div className="border-b border-on-surface w-full"></div>
          </div>
          {weeklyData.map((day, i) => {
            const incomeH = Math.round((day.income / maxValue) * 100);
            const expenseH = Math.round((day.expense / maxValue) * 100);
            const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString("es-MX", {
              weekday: "short",
            });
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                <div className="flex items-end gap-1.5 h-full w-full justify-center">
                  <div
                    className="w-10 bg-primary-container/40 rounded-t-lg group-hover:bg-primary transition-all duration-300 relative"
                    style={{ height: `${incomeH}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${day.income.toFixed(0)}
                    </div>
                  </div>
                  <div
                    className="w-10 bg-error/40 rounded-t-lg group-hover:bg-error transition-all duration-300"
                    style={{ height: `${expenseH}%` }}
                  ></div>
                </div>
                <span className="font-body text-xs font-bold text-outline-variant">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-surface-container-low rounded-[2.5rem] p-10 shadow-sm border border-outline-variant/10">
        <div className="flex items-center justify-between mb-10">
          <h3 className="font-headline font-bold text-2xl text-on-surface">
            Transacciones Recientes
          </h3>
        </div>

        <div className="flex flex-col">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-outline-variant/10 font-body text-[11px] uppercase tracking-widest text-outline font-bold">
            <div className="col-span-5 md:col-span-4">Detalle</div>
            <div className="col-span-3 hidden md:block">Categoría</div>
            <div className="col-span-4 md:col-span-3 text-right">Fecha</div>
            <div className="col-span-3 md:col-span-2 text-right">Monto</div>
          </div>

          {transactions.length === 0 ? (
            <p className="py-12 text-center text-on-surface/40 font-body text-sm">
              No hay transacciones registradas.
            </p>
          ) : (
            transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Sub-componente puro ───────────────────────────────────────────────────────
function TransactionRow({ transaction }: { transaction: FinancialTransaction }) {
  const isIncome = transaction.type === "income";
  const icon = isIncome ? "fitness_center" : "build";
  const date = new Date(transaction.date).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const amountStr = `${isIncome ? "+" : "-"}$${Math.abs(transaction.amount).toFixed(2)}`;

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-6 items-center rounded-2xl hover:bg-surface-container-low transition-all group relative cursor-pointer border-b border-outline-variant/5 last:border-0">
      <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity ${isIncome ? "bg-primary" : "bg-error"}`}></div>
      <div className="col-span-5 md:col-span-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isIncome ? "bg-primary-container/10 text-primary" : "bg-error/10 text-error"}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <div>
          <p className="font-body font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
            {transaction.description ?? "Sin descripción"}
          </p>
          <p className="font-body text-xs text-on-surface-variant font-medium">
            #{String(transaction.id).padStart(5, '0')}
          </p>
        </div>
      </div>
      <div className="col-span-3 hidden md:flex items-center">
        <span className="bg-surface-container-high text-on-surface text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          {transaction.category ?? "General"}
        </span>
      </div>
      <div className="col-span-4 md:col-span-3 text-right font-body text-sm text-on-surface-variant font-medium">
        {date}
      </div>
      <div className={`col-span-3 md:col-span-2 text-right font-headline font-black text-lg ${isIncome ? "text-primary" : "text-error"}`}>
        {amountStr}
      </div>
    </div>
  );
}
