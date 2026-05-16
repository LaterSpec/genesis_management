/**
 * finances.api.ts
 * ─────────────────────────────────────────────────────────────
 * Dominio: Transacciones Financieras.
 */

import { supabase } from "@/lib/supabase/client";
import type { FinancialTransaction, TransactionType } from "@/lib/database.types";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export interface DailyFinancialData {
  date: string; // YYYY-MM-DD
  income: number;
  expense: number;
}

// ─── Transacciones ─────────────────────────────────────────────────────────────

/** Obtiene transacciones, opcionalmente filtradas por rango de fechas. */
export async function getTransactions(options?: {
  from?: string; // ISO date string
  to?: string;
  type?: TransactionType;
  limit?: number;
}): Promise<FinancialTransaction[]> {
  let query = supabase
    .from("financial_transactions")
    .select("*")
    .order("date", { ascending: false });

  if (options?.from) query = query.gte("date", options.from);
  if (options?.to) query = query.lte("date", options.to);
  if (options?.type) query = query.eq("type", options.type);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`[finances.api] getTransactions: ${error.message}`);
  return (data ?? []) as FinancialTransaction[];
}

/** Registra una nueva transacción financiera. */
export async function registerTransaction(
  input: Omit<FinancialTransaction, "id" | "date"> & { date?: string }
): Promise<FinancialTransaction> {
  const { data, error } = await supabase
    .from("financial_transactions")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`[finances.api] registerTransaction: ${error.message}`);
  return data as FinancialTransaction;
}

/**
 * Resumen financiero: suma de ingresos y egresos.
 * Acepta rango de fechas opcional.
 */
export async function getFinancialSummary(options?: {
  from?: string;
  to?: string;
}): Promise<FinancialSummary> {
  let query = supabase.from("financial_transactions").select("type, amount");
  if (options?.from) query = query.gte("date", options.from);
  if (options?.to) query = query.lte("date", options.to);

  const { data, error } = await query;
  if (error) throw new Error(`[finances.api] getFinancialSummary: ${error.message}`);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of data ?? []) {
    if (row.type === "income") totalIncome += row.amount as number;
    else totalExpense += row.amount as number;
  }

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
  };
}

/**
 * Agrupación diaria de ingresos y egresos para los gráficos.
 * Devuelve los últimos N días (default 7).
 */
export async function getDailyFinancialData(days = 7): Promise<DailyFinancialData[]> {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("financial_transactions")
    .select("type, amount, date")
    .gte("date", from.toISOString())
    .order("date", { ascending: true });

  if (error) throw new Error(`[finances.api] getDailyFinancialData: ${error.message}`);

  // Crear mapa de fechas
  const map: Record<string, { income: number; expense: number }> = {};

  // Pre-inicializar los N días
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { income: 0, expense: 0 };
  }

  for (const row of data ?? []) {
    const key = (row.date as string).slice(0, 10);
    if (!map[key]) map[key] = { income: 0, expense: 0 };
    if (row.type === "income") map[key].income += row.amount as number;
    else map[key].expense += row.amount as number;
  }

  return Object.entries(map).map(([date, values]) => ({ date, ...values }));
}
