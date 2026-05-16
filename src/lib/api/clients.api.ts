/**
 * clients.api.ts
 * ─────────────────────────────────────────────────────────────
 * Dominio: Clientes, Membresías, Planes de Membresía, Créditos.
 * Todas las funciones son async y devuelven datos tipados.
 * Solo se usa en Server Components / Server Actions (no exponer a cliente).
 */

import { supabase } from "@/lib/supabase/client";
import type { Client, Membership, MembershipPlan, ClientCredit } from "@/lib/database.types";

// ─── Clientes ──────────────────────────────────────────────────────────────────

export type ClientWithMembership = Client & {
  memberships: Array<Membership & { membership_plans: MembershipPlan | null }>;
};

/** Devuelve todos los clientes con su membresía activa más reciente. */
export async function getClients(filters?: {
  status?: string;
}): Promise<ClientWithMembership[]> {
  let query = supabase
    .from("clients")
    .select(
      `
      *,
      memberships (
        *,
        membership_plans (*)
      )
    `
    )
    .order("join_date", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`[clients.api] getClients: ${error.message}`);
  return (data ?? []) as ClientWithMembership[];
}

/** Cuenta total de clientes activos e incorporaciones del mes actual. */
export async function getClientStats(): Promise<{
  totalActive: number;
  newThisMonth: number;
}> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [activeResult, newResult] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .gte("join_date", firstDayOfMonth),
  ]);

  if (activeResult.error) throw new Error(`[clients.api] getClientStats (active): ${activeResult.error.message}`);
  if (newResult.error) throw new Error(`[clients.api] getClientStats (new): ${newResult.error.message}`);

  return {
    totalActive: activeResult.count ?? 0,
    newThisMonth: newResult.count ?? 0,
  };
}

/** Busca un cliente por su ID, incluyendo todas sus membresías. */
export async function getClientById(id: string): Promise<ClientWithMembership | null> {
  const { data, error } = await supabase
    .from("clients")
    .select(`*, memberships (*, membership_plans (*))`)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`[clients.api] getClientById: ${error.message}`);
  }
  return data as ClientWithMembership;
}

/** Crea un nuevo cliente. Retorna el registro insertado. */
export async function createClient(
  input: Pick<Client, "first_name" | "last_name" | "email" | "dni" | "phone">
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...input, status: "active" })
    .select()
    .single();

  if (error) throw new Error(`[clients.api] createClient: ${error.message}`);
  return data as Client;
}

/** Actualiza un cliente existente. */
export async function updateClient(
  id: string,
  input: Partial<Pick<Client, "first_name" | "last_name" | "email" | "dni" | "phone" | "status">>
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`[clients.api] updateClient: ${error.message}`);
  return data as Client;
}

/** Elimina un cliente. */
export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(`[clients.api] deleteClient: ${error.message}`);
}

/** Actualiza el estado (active/inactive) de un cliente. */
export async function updateClientStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from("clients").update({ status }).eq("id", id);
  if (error) throw new Error(`[clients.api] updateClientStatus: ${error.message}`);
}

// ─── Planes de Membresía ───────────────────────────────────────────────────────

/** Obtiene todos los planes de membresía disponibles. */
export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .order("price", { ascending: true });

  if (error) throw new Error(`[clients.api] getMembershipPlans: ${error.message}`);
  return (data ?? []) as MembershipPlan[];
}

// ─── Créditos ──────────────────────────────────────────────────────────────────

export type ClientCreditWithClient = ClientCredit & { clients: Client };

/**
 * Obtiene todos los créditos activos (balance > 0) con datos del cliente.
 * Ordena de mayor a menor deuda para priorización visual.
 */
export async function getActiveCredits(): Promise<ClientCreditWithClient[]> {
  const { data, error } = await supabase
    .from("client_credits")
    .select(`*, clients (*)`)
    .gt("balance", 0)
    .order("balance", { ascending: false });

  if (error) throw new Error(`[clients.api] getActiveCredits: ${error.message}`);
  return (data ?? []) as ClientCreditWithClient[];
}

/** Suma total de la cartera de deudas activas. */
export async function getCreditPortfolioTotal(): Promise<number> {
  const { data, error } = await supabase
    .from("client_credits")
    .select("balance")
    .gt("balance", 0);

  if (error) throw new Error(`[clients.api] getCreditPortfolioTotal: ${error.message}`);
  return (data ?? []).reduce((sum: number, row: { balance: number }) => sum + row.balance, 0);
}
