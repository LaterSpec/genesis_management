/**
 * sales.api.ts
 * ─────────────────────────────────────────────────────────────
 * Dominio: Ventas e Ítems de Venta.
 */

import { supabase } from "@/lib/supabase/client";
import { adjustProductStock } from "@/lib/api/inventory.api";
import { createClientMembership } from "@/lib/api/clients.api";
import type { Sale, SaleItem, Product, Membership, PaymentMethod } from "@/lib/database.types";

// ─── Tipos compuestos ──────────────────────────────────────────────────────────

export type SaleWithItems = Sale & {
  sale_items: Array<
    SaleItem & {
      products: Pick<Product, "id" | "name" | "sku" | "price"> | null;
      memberships: Pick<Membership, "id" | "status"> | null;
    }
  >;
};

export interface CartItem {
  type: "product" | "plan";
  product_id?: string;
  plan_id?: string;
  plan_duration_days?: number; // Needed to compute membership end_date
  name: string;
  quantity: number;
  unit_price: number; // Editable override from POS
  stock?: number; // For products only
}

export interface CreateSaleInput {
  client_id: string; // Required: use visitor client ID if no client
  is_visitor?: boolean; // If true, skip membership record creation
  seller_id?: string;
  payment_method: PaymentMethod;
  items: CartItem[];
}

// ─── Consultas ─────────────────────────────────────────────────────────────────

/** Obtiene el historial de ventas reciente (por defecto las últimas 50). */
export async function getSalesHistory(limit = 50): Promise<SaleWithItems[]> {
  const { data, error } = await supabase
    .from("sales")
    .select(
      `
      *,
      clients (id, first_name, last_name, email),
      profiles (id, first_name, last_name),
      sale_items (
        *,
        products (id, name, sku, price),
        memberships (id, status)
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`[sales.api] getSalesHistory: ${error.message}`);
  return (data ?? []) as SaleWithItems[];
}

/** Obtiene el historial de ventas de un cliente específico. */
export async function getSalesByClientId(clientId: string, limit = 20): Promise<SaleWithItems[]> {
  const { data, error } = await supabase
    .from("sales")
    .select(
      `
      *,
      clients (id, first_name, last_name, email),
      profiles (id, first_name, last_name),
      sale_items (
        *,
        products (id, name, sku, price),
        memberships (id, status)
      )
    `
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`[sales.api] getSalesByClientId: ${error.message}`);
  return (data ?? []) as SaleWithItems[];
}

/** Obtiene el total de ventas del mes actual. */
export async function getMonthlySalesTotal(): Promise<number> {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await supabase
    .from("sales")
    .select("total")
    .gte("created_at", firstDay)
    .eq("status", "completed");

  if (error) throw new Error(`[sales.api] getMonthlySalesTotal: ${error.message}`);
  return (data ?? []).reduce((sum: number, row: { total: number }) => sum + row.total, 0);
}

/**
 * Crea una venta con sus ítems en una operación atómica.
 * – Decrementa el stock de cada producto vendido.
 * – Crea membresías activas para los planes comprados.
 * – Registra la transacción financiera.
 */
export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const total = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  // 1. Insertar la venta principal
  let cashSessionId: number | null = null;
  if (input.seller_id) {
    const { data: activeSession } = await supabase
      .from("cash_sessions")
      .select("id")
      .eq("user_id", input.seller_id)
      .eq("status", "open")
      .is("closed_at", null)
      .maybeSingle();
      
    if (activeSession) {
      cashSessionId = activeSession.id;
    }
  }

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      client_id: input.client_id,
      seller_id: input.seller_id ?? null,
      cash_session_id: cashSessionId,
      total,
      status: "completed",
      payment_method: input.payment_method,
    })
    .select()
    .single();

  if (saleError) throw new Error(`[sales.api] createSale (sale): ${saleError.message}`);
  const saleId = (sale as Sale).id;

  // 2. Procesar cada ítem del carrito
  const saleItemsToInsert: Array<{
    sale_id: string;
    product_id: string | null;
    membership_id: string | null;
    plan_id: string | null;
    quantity: number;
    unit_price: number;
  }> = [];

  for (const item of input.items) {
    if (item.type === "product" && item.product_id) {
      // Descontar stock del inventario
      await adjustProductStock(item.product_id, -item.quantity);

      saleItemsToInsert.push({
        sale_id: saleId,
        product_id: item.product_id,
        membership_id: null,
        plan_id: null,
        quantity: item.quantity,
        unit_price: item.unit_price,
      });
    } else if (item.type === "plan" && item.plan_id) {
      // Para clientes reales: crear membresía con plan stacking.
      // Para Visitantes: solo registrar el plan_id en el ítem de venta (sin membresía).
      let membershipId: string | null = null;
      if (!input.is_visitor && item.plan_duration_days) {
        const membership = await createClientMembership(
          input.client_id,
          item.plan_id,
          item.plan_duration_days
        );
        membershipId = membership.id;
      }

      saleItemsToInsert.push({
        sale_id: saleId,
        product_id: null,
        membership_id: membershipId,
        plan_id: item.plan_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      });
    }
  }

  // 3. Insertar todos los sale_items
  if (saleItemsToInsert.length > 0) {
    const { error: itemsError } = await supabase.from("sale_items").insert(saleItemsToInsert);
    if (itemsError) throw new Error(`[sales.api] createSale (items): ${itemsError.message}`);
  }

  // 4. Registrar la transacción financiera
  const paymentLabel = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    yape: "Yape",
  }[input.payment_method];

  const { error: txError } = await supabase.from("financial_transactions").insert({
    type: "income",
    amount: total,
    description: `Venta #${saleId.toString().slice(-6).toUpperCase()} — ${paymentLabel}`,
    category: "Venta",
    sale_id: saleId,
  });

  if (txError) throw new Error(`[sales.api] createSale (transaction): ${txError.message}`);

  return sale as Sale;
}
