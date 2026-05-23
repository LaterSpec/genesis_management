"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { FinancialSummary, DailyFinancialData } from "@/lib/api/finances.api";
import type { CashSession, SoldItemDetails } from "@/lib/api/cash-sessions.api";
import type { StaffMember } from "@/lib/api/users.api";
import type { FinancialTransaction } from "@/lib/database.types";
import { getCashSessionSalesDetails } from "@/lib/api/cash-sessions.api";

// ─── Modal/Popup para Detalle de Productos Vendidos ──────────────────────────────────
interface SalesDetailModalProps {
  isOpen: boolean;
  session: CashSession | null;
  onClose: () => void;
}

function SalesDetailModal({ isOpen, session, onClose }: SalesDetailModalProps) {
  const [items, setItems] = useState<SoldItemDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && session) {
      setLoading(true);
      setSearchQuery("");
      getCashSessionSalesDetails(session.id)
        .then((res) => {
          setItems(res);
        })
        .catch((err) => {
          console.error("Error al obtener detalles de venta de la sesión:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setItems([]);
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  // Filtrado reactivo en tiempo real
  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      (item.sku && item.sku.toLowerCase().includes(query))
    );
  });

  // Suma total inteligente acorde al filtro
  const dynamicTotal = filteredItems.reduce((sum, item) => sum + item.total, 0);

  const initials = session.profiles
    ? `${session.profiles.first_name[0]}${session.profiles.last_name[0]}`.toUpperCase()
    : "—";
  const sellerName = session.profiles
    ? `${session.profiles.first_name} ${session.profiles.last_name}`
    : "Desconocido";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Dialog */}
      <div className="relative bg-surface-container-low max-w-xl w-full rounded-[2rem] p-8 shadow-2xl border border-outline-variant/10 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center text-primary font-extrabold text-sm shadow-sm select-none">
              {initials}
            </div>
            <div>
              <h3 className="font-headline font-black text-xl text-on-surface">
                Productos Vendidos
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Caja abierta por: <span className="font-semibold text-on-surface">{sellerName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative mb-6 shrink-0">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none text-[20px]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, categoría o tipo..."
            className="w-full bg-surface-container-high rounded-2xl pl-12 pr-10 py-3.5 text-sm text-on-surface focus:outline-none border border-outline-variant/10 focus:ring-2 focus:ring-primary transition-shadow placeholder:text-on-surface-variant/40 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <span className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></span>
              <p className="text-xs text-on-surface-variant font-medium font-body animate-pulse">
                Cargando desglose de ventas...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-outline-variant/40 text-5xl block mb-3">
                inventory_2
              </span>
              <p className="text-sm text-on-surface-variant font-body font-medium">
                {items.length === 0
                  ? "No se registraron ventas en este turno de caja."
                  : "No hay resultados que coincidan con la búsqueda."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, idx) => {
                const isMembership = item.type === "Membresía";
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-surface-container-lowest hover:bg-surface-container/30 border border-outline-variant/5 rounded-2xl p-4 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isMembership
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary-container/10 text-secondary"
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {isMembership ? "badge" : "shopping_bag"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                          {item.name}
                        </p>
                        <p className="font-body text-xs text-on-surface-variant font-medium mt-0.5">
                          {item.type} • SKU: <span className="font-semibold text-on-surface/80">{item.sku}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-headline font-extrabold text-sm text-on-surface">
                        S/ {item.total.toFixed(2)}
                      </p>
                      <p className="font-body text-[11px] text-on-surface-variant font-medium mt-0.5">
                        {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"} x S/ {item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Sum */}
        <div className="mt-6 pt-4 border-t border-outline-variant/10 shrink-0 flex items-center justify-between">
          <div>
            <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
              Total Recaudado (Filtrado)
            </p>
            <p className="text-[10px] text-on-surface-variant/60 font-body font-semibold mt-0.5">
              Refleja únicamente los ítems visibles en pantalla
            </p>
          </div>
          <div className="text-right">
            <span className="font-headline font-black text-3xl text-primary tracking-tight">
              S/ {dynamicTotal.toFixed(2)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Componente Principal FinanceManager ──────────────────────────────────────────────
interface FinanceManagerProps {
  summary: FinancialSummary;
  transactions: FinancialTransaction[];
  weeklyData: DailyFinancialData[];
  initialSessions: CashSession[];
  staffList: StaffMember[];
}

export default function FinanceManager({
  summary,
  transactions,
  weeklyData,
  initialSessions,
  staffList,
}: FinanceManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Tab actual basado en query parameters
  const currentTab = searchParams.get("tab") === "sessions" ? "sessions" : "flow";

  // Filtros reactivos en memoria
  const [workerFilter, setWorkerFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sessionsList, setSessionsList] = useState<CashSession[]>(initialSessions);
  const [selectedSession, setSelectedSession] = useState<CashSession | null>(null);

  // Gráfico de Ingresos vs Egresos
  const maxValue = Math.max(...weeklyData.map((d) => Math.max(d.income, d.expense)), 1);

  // Filtrado reactivo de las sesiones
  const filteredSessions = sessionsList.filter((session) => {
    const matchesWorker = workerFilter === "all" || session.user_id === workerFilter;

    let matchesDate = true;
    if (dateFilter) {
      const sessionDate = session.opened_at.slice(0, 10); // YYYY-MM-DD
      matchesDate = sessionDate === dateFilter;
    }

    return matchesWorker && matchesDate;
  });

  // Cambiar pestaña actual
  const handleTabChange = (tab: "flow" | "sessions") => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setWorkerFilter("all");
    setDateFilter("");
  };

  return (
    <>
      {/* Modal para detalle de ítems vendidos */}
      <SalesDetailModal
        isOpen={!!selectedSession}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      {/* Page Header & Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12 animate-in fade-in duration-300">
        <div>
          <h2 className="font-headline font-black text-4xl md:text-5xl text-on-surface tracking-tight">
            Finanzas y Caja
          </h2>
          <p className="font-body text-on-surface-variant mt-2 text-sm max-w-md">
            Visualización general de ingresos, egresos y el control de turnos de la caja registradora.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-surface-container rounded-full p-1 border border-outline-variant/10 shadow-sm relative">
          <button
            onClick={() => handleTabChange("flow")}
            className={`rounded-full px-6 py-2.5 text-xs font-body font-bold transition-all cursor-pointer relative z-10 ${
              currentTab === "flow"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Flujo de Caja
          </button>
          <button
            onClick={() => handleTabChange("sessions")}
            className={`rounded-full px-6 py-2.5 text-xs font-body font-bold transition-all cursor-pointer relative z-10 ${
              currentTab === "sessions"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Sesiones de Caja
          </button>
        </div>
      </div>

      {/* Contenido según pestaña */}
      {currentTab === "flow" ? (
        <div className="space-y-12 animate-in fade-in duration-300">
          {/* Top Level Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Total Ingresos */}
            <div className="bg-surface-container-low rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <span className="font-body text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
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
                  S/ {summary.totalIncome.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Total Egresos */}
            <div className="bg-surface-container-low rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-error-container/20 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <span className="font-body text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
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
                  S/ {summary.totalExpense.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Balance Neto */}
            <div className="bg-gradient-cta text-white rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-primary/20 hover:shadow-xl transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <span className="font-body text-[11px] uppercase tracking-widest text-white/75 font-bold">
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
                  S/ {summary.netBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
                <span className="font-body text-xs text-white/80 font-semibold">
                  {summary.netBalance > 0 ? "Margen operativo positivo" : "Balance negativo acumulado"}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-surface-container-low rounded-[2.5rem] p-10 shadow-sm border border-outline-variant/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <h3 className="font-headline font-bold text-2xl text-on-surface">Ingresos vs Egresos semanales</h3>
              <div className="flex gap-6 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                  <span className="font-body text-xs text-on-surface-variant font-bold">Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error"></div>
                  <span className="font-body text-xs text-on-surface-variant font-bold">Egresos</span>
                </div>
              </div>
            </div>

            <div className="h-72 flex items-end justify-between gap-4 px-6 relative border-b border-outline-variant/20 pb-6">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 py-6">
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
                        className="w-8 sm:w-10 bg-primary/45 rounded-t-lg group-hover:bg-primary transition-all duration-300 relative shadow-sm"
                        style={{ height: `${incomeH}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none font-bold">
                          S/ {day.income.toFixed(0)}
                        </div>
                      </div>
                      <div
                        className="w-8 sm:w-10 bg-error/45 rounded-t-lg group-hover:bg-error transition-all duration-300 relative shadow-sm"
                        style={{ height: `${expenseH}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none font-bold">
                          S/ {day.expense.toFixed(0)}
                        </div>
                      </div>
                    </div>
                    <span className="font-body text-xs font-bold text-outline-variant capitalize">{dayLabel}</span>
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
                <div className="col-span-6 md:col-span-4">Detalle</div>
                <div className="col-span-3 hidden md:block">Categoría</div>
                <div className="col-span-3 md:col-span-3 text-right">Fecha</div>
                <div className="col-span-3 md:col-span-2 text-right">Monto</div>
              </div>

              {transactions.length === 0 ? (
                <p className="py-12 text-center text-on-surface/40 font-body text-sm">
                  No hay transacciones registradas.
                </p>
              ) : (
                transactions.map((tx) => {
                  const isIncome = tx.type === "income";
                  const icon = isIncome ? "fitness_center" : "build";
                  const date = new Date(tx.date).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const amountStr = `${isIncome ? "+" : "-"}S/ ${Math.abs(tx.amount).toFixed(2)}`;

                  return (
                    <div
                      key={tx.id}
                      className="grid grid-cols-12 gap-4 px-6 py-6 items-center rounded-2xl hover:bg-surface-container transition-all group relative cursor-pointer border-b border-outline-variant/5 last:border-0"
                    >
                      <div
                        className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity ${
                          isIncome ? "bg-primary" : "bg-error"
                        }`}
                      ></div>
                      <div className="col-span-6 md:col-span-4 flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                            isIncome
                              ? "bg-primary/10 text-primary"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">{icon}</span>
                        </div>
                        <div>
                          <p className="font-body font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                            {tx.description ?? "Sin descripción"}
                          </p>
                          <p className="font-body text-xs text-on-surface-variant font-medium">
                            #{String(tx.id).padStart(5, "0")}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-3 hidden md:flex items-center">
                        <span className="bg-surface-container-high text-on-surface text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                          {tx.category ?? "General"}
                        </span>
                      </div>
                      <div className="col-span-3 md:col-span-3 text-right font-body text-sm text-on-surface-variant font-semibold">
                        {date}
                      </div>
                      <div
                        className={`col-span-3 md:col-span-2 text-right font-headline font-black text-lg ${
                          isIncome ? "text-primary" : "text-error"
                        }`}
                      >
                        {amountStr}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Filters Bar */}
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              
              {/* Worker Dropdown */}
              <div className="flex flex-col w-full sm:w-56">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1.5 pl-1">
                  Trabajador
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
                    badge
                  </span>
                  <select
                    value={workerFilter}
                    onChange={(e) => setWorkerFilter(e.target.value)}
                    className="w-full bg-surface-container appearance-none border-none rounded-xl py-3 pl-12 pr-10 text-xs font-body font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="all">Todos los trabajadores</option>
                    {staffList.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.first_name} {worker.last_name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                    arrow_drop_down
                  </span>
                </div>
              </div>

              {/* Date Filter */}
              <div className="flex flex-col w-full sm:w-52">
                <label className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1.5 pl-1">
                  Fecha de Apertura
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
                    calendar_today
                  </span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full bg-surface-container border-none rounded-xl py-2.5 pl-12 pr-4 text-xs font-body font-semibold text-on-surface focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  />
                </div>
              </div>

            </div>

            {/* Clear Button / Reset */}
            {(workerFilter !== "all" || dateFilter !== "") && (
              <button
                onClick={handleClearFilters}
                className="w-full md:w-auto px-6 py-3 rounded-full hover:bg-surface-container-high text-xs font-body font-bold text-on-surface-variant hover:text-on-surface border border-outline-variant/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                Limpiar Filtros
              </button>
            )}

          </div>

          {/* List of Sessions */}
          <div className="bg-surface-container-low rounded-[2.5rem] p-10 shadow-sm border border-outline-variant/10">
            <h3 className="font-headline font-bold text-2xl text-on-surface mb-8">
              Historial de Sesiones
            </h3>

            {filteredSessions.length === 0 ? (
              <div className="py-24 text-center">
                <span className="material-symbols-outlined text-outline-variant/30 text-6xl block mb-4">
                  point_of_sale
                </span>
                <p className="text-sm font-body font-semibold text-on-surface-variant">
                  No se encontraron sesiones de caja con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => {
                  const initials = session.profiles
                    ? `${session.profiles.first_name[0]}${session.profiles.last_name[0]}`.toUpperCase()
                    : "—";
                  const sellerName = session.profiles
                    ? `${session.profiles.first_name} ${session.profiles.last_name}`
                    : "Desconocido";

                  const openTime = new Date(session.opened_at).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const closeTime = session.closed_at
                    ? new Date(session.closed_at).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : null;

                  const isActive = session.status === "open";
                  const salesAmount = Number(session.total_sales ?? 0);
                  const grandTotal = Number(session.initial_amount) + salesAmount;

                  return (
                    <div
                      key={session.id}
                      className="bg-surface-container/30 hover:bg-surface-container/60 border border-outline-variant/5 rounded-3xl p-6 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group relative"
                    >
                      {/* Left Hover accent */}
                      <div
                        className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity ${
                          isActive ? "bg-primary" : "bg-outline"
                        }`}
                      />

                      {/* Staff & Status */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center text-primary font-black text-sm shadow-sm select-none">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <h4 className="font-body font-extrabold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                              {sellerName}
                            </h4>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold border border-primary/10 select-none animate-pulse">
                                Activa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold border border-outline-variant/10 select-none">
                                Cerrada
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-on-surface-variant font-medium mt-1">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">login</span>
                              {openTime}
                            </span>
                            {closeTime && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">logout</span>
                                {closeTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amounts Display */}
                      <div className="grid grid-cols-3 gap-6 sm:gap-10 shrink-0 text-left font-body">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                            Monto Inicial
                          </p>
                          <p className="font-headline font-black text-sm text-on-surface mt-1">
                            S/ {Number(session.initial_amount).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                            Ventas Turno
                          </p>
                          <p className="font-headline font-black text-sm text-primary mt-1">
                            +S/ {salesAmount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                            Total Estimado
                          </p>
                          <p className="font-headline font-black text-sm text-on-surface mt-1">
                            S/ {grandTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 w-full md:w-auto">
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="w-full md:w-auto bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-body font-bold rounded-2xl py-3 px-5 border border-outline-variant/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                          Ver productos vendidos
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </>
  );
}
