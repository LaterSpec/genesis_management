/**
 * logs.api.ts
 * ─────────────────────────────────────────────────────────────
 * Dominio: Registro de Actividad del Sistema.
 */

import { supabase } from "@/lib/supabase/client";
import type { ActivityLog, Profile, Client } from "@/lib/database.types";

// ─── Tipos compuestos ──────────────────────────────────────────────────────────

export type ActivityLogFull = ActivityLog & {
  profiles: Pick<Profile, "id" | "first_name" | "last_name" | "role"> | null;
  clients: Pick<Client, "id" | "first_name" | "last_name" | "email"> | null;
};

export type LogActionType =
  | "ACCESS_GRANTED"
  | "ACCESS_DENIED"
  | "SALE_CREATED"
  | "MEMBERSHIP_CREATED"
  | "MEMBERSHIP_EXPIRED"
  | "STOCK_ADJUSTMENT"
  | "CREDIT_ADDED"
  | "CREDIT_PAID";

// ─── Consultas ─────────────────────────────────────────────────────────────────

/** Obtiene los logs de actividad con paginación y filtros opcionales. */
export async function getActivityLogs(options?: {
  actionType?: LogActionType;
  isError?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: ActivityLogFull[]; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("activity_logs")
    .select(
      `
      *,
      profiles (id, first_name, last_name, role),
      clients (id, first_name, last_name, email)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.actionType) query = query.eq("action_type", options.actionType);
  if (options?.isError !== undefined) query = query.eq("is_error", options.isError);
  if (options?.from) query = query.gte("created_at", options.from);
  if (options?.to) query = query.lte("created_at", options.to);

  const { data, error, count } = await query;
  if (error) throw new Error(`[logs.api] getActivityLogs: ${error.message}`);

  return {
    data: (data ?? []) as ActivityLogFull[],
    total: count ?? 0,
  };
}

/** Obtiene los logs más recientes para el widget de actividad del dashboard. */
export async function getRecentActivityLogs(limit = 5): Promise<ActivityLogFull[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select(
      `
      *,
      profiles (id, first_name, last_name, role),
      clients (id, first_name, last_name, email)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`[logs.api] getRecentActivityLogs: ${error.message}`);
  return (data ?? []) as ActivityLogFull[];
}

/**
 * Registra una acción en el log de actividad.
 * Usar en Server Actions tras operaciones importantes.
 */
export async function logAction(input: {
  user_id?: string;
  client_id?: string;
  action_type: LogActionType | string;
  description: string;
  is_error?: boolean;
}): Promise<void> {
  const { error } = await supabase.from("activity_logs").insert({
    user_id: input.user_id ?? null,
    client_id: input.client_id ?? null,
    action_type: input.action_type,
    description: input.description,
    is_error: input.is_error ?? false,
  });

  if (error) throw new Error(`[logs.api] logAction: ${error.message}`);
}
