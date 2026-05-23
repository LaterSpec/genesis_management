"use server";

import { createSale } from "@/lib/api/sales.api";
import { logAction } from "@/lib/api/logs.api";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { PaymentMethod } from "@/lib/database.types";
import type { CartItem } from "@/lib/api/sales.api";

const PATHS = [
  "/pages/sales",
  "/pages/dashboard",
  "/pages/inventory",
  "/pages/clients",
  "/pages/activity_log",
  "/pages/finances",
  "/pages/memberships",
];

export interface ProcessSaleResult {
  success: boolean;
  saleId?: string;
  total?: number;
  error?: string;
}

export async function processSaleAction(
  clientId: string,
  items: CartItem[],
  paymentMethod: PaymentMethod,
  isVisitor: boolean
): Promise<ProcessSaleResult> {
  try {
    // Resolve the logged-in seller
    const supabase = await createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const sale = await createSale({
      client_id: clientId,
      is_visitor: isVisitor,
      seller_id: user?.id ?? undefined,
      payment_method: paymentMethod,
      items,
    });

    // Log the activity
    const itemNames = items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    await logAction({
      action_type: "SALE_CREATED",
      description: `Venta #${sale.id.toString().slice(-6).toUpperCase()} — S/ ${Number(sale.total).toFixed(2)} — ${paymentMethod} — ${itemNames}`,
      user_id: user?.id,
      client_id: clientId.toString(),
    });

    PATHS.forEach((p) => revalidatePath(p));

    return { success: true, saleId: sale.id, total: sale.total };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado al procesar la venta.";
    return { success: false, error: msg };
  }
}
