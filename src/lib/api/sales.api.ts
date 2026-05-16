/**
 * sales.api.ts
 * ─────────────────────────────────────────────────────────────
 * Dominio: Ventas e Ítems de Venta.
 */

import { supabase } from "@/lib/supabase/client";
import type { Sale, SaleItem, Product, Membership } from "@/lib/database.types";

// ─── Tipos compuestos ──────────────────────────────────────────────────────────

export type SaleWithItems = Sale & {
  sale_items: Array<
    SaleItem & {
      products: Pick<Product, "id" | "name" | "sku" | "price"> | null;
      memberships: Pick<Membership, "id" | "status"> | null;
    }
  >;
};

export interface CreateSaleInput {
  client_id?: string;
  seller_id?: string;
  items: Array<{
    product_id?: string;
    membership_id?: string;
    quantity: number;
    unit_price: number;
  }>;
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
 * Crea una venta con sus ítems en una sola operación atómica.
 * Calcula el total automáticamente y registra la transacción financiera.
 */
export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const total = input.items.reduce(
    (sum: number, item: { quantity: number; unit_price: number }) =>
      sum + item.quantity * item.unit_price,
    0
  );

  // 1. Insertar la venta
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      client_id: input.client_id ?? null,
      seller_id: input.seller_id ?? null,
      total,
      status: "completed",
    })
    .select()
    .single();

  if (saleError) throw new Error(`[sales.api] createSale (sale): ${saleError.message}`);

  // 2. Insertar los ítems
  const items = input.items.map((item) => ({
    sale_id: (sale as Sale).id,
    product_id: item.product_id ?? null,
    membership_id: item.membership_id ?? null,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  const { error: itemsError } = await supabase.from("sale_items").insert(items);
  if (itemsError) throw new Error(`[sales.api] createSale (items): ${itemsError.message}`);

  // 3. Registrar la transacción financiera
  const { error: txError } = await supabase.from("financial_transactions").insert({
    type: "income",
    amount: total,
    description: `Venta #${(sale as Sale).id.slice(0, 8).toUpperCase()}`,
    category: "Venta",
    sale_id: (sale as Sale).id,
  });

  if (txError) throw new Error(`[sales.api] createSale (transaction): ${txError.message}`);

  return sale as Sale;
}
