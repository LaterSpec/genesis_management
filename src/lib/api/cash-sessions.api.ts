/**
 * cash-sessions.api.ts
 * ─────────────────────────────────────────────────────────────
 * Dominio: Sesiones de Caja (Apertura y Cierre).
 */

import { supabase } from "@/lib/supabase/client";

export interface CashSession {
  id: string;
  user_id: string;
  opened_at: string;
  closed_at: string | null;
  status: "open" | "closed";
  initial_amount: number;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  total_sales?: number;
}

export interface SoldItemDetails {
  name: string;
  sku: string;
  type: string;
  price: number;
  quantity: number;
  total: number;
}

/**
 * Obtiene la sesión de caja activa de un usuario (recepcionista).
 */
export async function getActiveCashSession(userId: string): Promise<CashSession | null> {
  const { data, error } = await supabase
    .from("cash_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "open")
    .is("closed_at", null)
    .maybeSingle();

  if (error) {
    console.error("[cash-sessions.api] getActiveCashSession:", error);
    throw new Error(error.message);
  }

  return data as CashSession | null;
}

/**
 * Abre una nueva sesión de caja registradora.
 */
export async function openCashSession(userId: string, initialAmount = 0): Promise<CashSession> {
  const { data, error } = await supabase
    .from("cash_sessions")
    .insert({
      user_id: userId,
      initial_amount: initialAmount,
      opened_at: new Date().toISOString(),
      status: "open",
    })
    .select()
    .single();

  if (error) {
    console.error("[cash-sessions.api] openCashSession:", error);
    throw new Error(error.message);
  }

  return data as CashSession;
}

/**
 * Cierra una sesión de caja registradora.
 */
export async function closeCashSession(sessionId: string): Promise<CashSession> {
  const { data, error } = await supabase
    .from("cash_sessions")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("[cash-sessions.api] closeCashSession:", error);
    throw new Error(error.message);
  }

  return data as CashSession;
}

/**
 * Obtiene el listado de todas las sesiones de caja históricas.
 * Cruza con profiles para obtener el trabajador y con sales para calcular el total vendido.
 */
export async function getCashSessions(options?: { userId?: string }): Promise<CashSession[]> {
  let query = supabase
    .from("cash_sessions")
    .select(`
      *,
      profiles:user_id (id, first_name, last_name),
      sales:sales (id, total)
    `);

  if (options?.userId && options.userId !== "all") {
    query = query.eq("user_id", options.userId);
  }

  const { data, error } = await query.order("opened_at", { ascending: false });

  if (error) {
    console.error("[cash-sessions.api] getCashSessions:", error);
    throw new Error(error.message);
  }

  return (data ?? []).map((session: any) => {
    const totalSales = (session.sales ?? []).reduce(
      (sum: number, sale: any) => sum + Number(sale.total),
      0
    );
    return {
      ...session,
      total_sales: totalSales,
    };
  }) as CashSession[];
}

/**
 * Obtiene el detalle unificado y agrupado de todos los ítems (productos y planes)
 * vendidos bajo una sesión de caja específica.
 */
export async function getCashSessionSalesDetails(sessionId: string): Promise<SoldItemDetails[]> {
  const { data, error } = await supabase
    .from("sale_items")
    .select(`
      id,
      quantity,
      unit_price,
      products (id, name, sku, price),
      plan:plan_id (id, name, price),
      sales!inner (id, cash_session_id)
    `)
    .eq("sales.cash_session_id", sessionId);

  if (error) {
    console.error("[cash-sessions.api] getCashSessionSalesDetails:", error);
    throw new Error(error.message);
  }

  // Transformar ítems planos
  const items = (data ?? []).map((item: any) => {
    const isProduct = !!item.products;
    const name = isProduct ? item.products.name : (item.plan?.name ?? "Plan de Membresía");
    const sku = isProduct ? item.products.sku : "PLAN";
    const type = isProduct ? "Producto" : "Membresía";
    const price = Number(item.unit_price);
    const quantity = Number(item.quantity);
    const total = price * quantity;

    return {
      name,
      sku,
      type,
      price,
      quantity,
      total,
    };
  });

  // Agrupar ítems idénticos para ver totales unificados
  const grouped: Record<string, SoldItemDetails> = {};
  for (const item of items) {
    const key = `${item.type}-${item.name}-${item.price}`;
    if (!grouped[key]) {
      grouped[key] = {
        name: item.name,
        sku: item.sku,
        type: item.type,
        price: item.price,
        quantity: 0,
        total: 0,
      };
    }
    grouped[key].quantity += item.quantity;
    grouped[key].total += item.total;
  }

  // Ordenar por cantidad vendida descendentemente
  return Object.values(grouped).sort((a, b) => b.quantity - a.quantity);
}
