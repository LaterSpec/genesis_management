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
    .neq("dni", "00000000") // Excluir el cliente comodín Visitante
    .order("join_date", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`[clients.api] getClients: ${error.message}`);
  return (data ?? []) as ClientWithMembership[];
}

/** Devuelve todos los clientes activos (incluyendo Visitante) para el selector del POS. */
export async function getClientsForPOS(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, dni, email, status, join_date, phone")
    .eq("status", "active")
    .order("first_name", { ascending: true });

  if (error) throw new Error(`[clients.api] getClientsForPOS: ${error.message}`);
  return (data ?? []) as Client[];
}

/** Obtiene el ID del cliente comodín "Visitante". */
export async function getVisitorClientId(): Promise<string> {
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("dni", "00000000")
    .single();

  if (error) throw new Error(`[clients.api] getVisitorClientId: ${error.message}`);
  return (data as { id: string }).id;
}

/** Cuenta total de clientes activos e incorporaciones del mes actual. */
export async function getClientStats(): Promise<{
  totalActive: number;
  newThisMonth: number;
}> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [activeResult, newResult] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active").neq("dni", "00000000"),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .gte("join_date", firstDayOfMonth)
      .neq("dni", "00000000"),
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
  input: Partial<Pick<Client, "first_name" | "last_name" | "email" | "dni" | "phone" | "status" | "notes">>
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

// ─── Planes de Membresía (CRUD Completo) ──────────────────────────────────────

/** Obtiene todos los planes de membresía disponibles. */
export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .order("price", { ascending: true });

  if (error) throw new Error(`[clients.api] getMembershipPlans: ${error.message}`);
  return (data ?? []) as MembershipPlan[];
}

/** Crea un nuevo plan de membresía. */
export async function createMembershipPlan(
  input: Pick<MembershipPlan, "name" | "description" | "price" | "duration_days" | "allowed_entries">
): Promise<MembershipPlan> {
  const { data, error } = await supabase
    .from("membership_plans")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`[clients.api] createMembershipPlan: ${error.message}`);
  return data as MembershipPlan;
}

/** Actualiza un plan de membresía. */
export async function updateMembershipPlan(
  id: string,
  input: Partial<Pick<MembershipPlan, "name" | "description" | "price" | "duration_days" | "allowed_entries">>
): Promise<MembershipPlan> {
  const { data, error } = await supabase
    .from("membership_plans")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`[clients.api] updateMembershipPlan: ${error.message}`);
  return data as MembershipPlan;
}

/** Elimina un plan de membresía. */
export async function deleteMembershipPlan(id: string): Promise<void> {
  const { error } = await supabase.from("membership_plans").delete().eq("id", id);
  if (error) throw new Error(`[clients.api] deleteMembershipPlan: ${error.message}`);
}

// ─── Membresías de Clientes ────────────────────────────────────────────────────

export type MembershipWithRelations = Membership & {
  clients: Client | null;
  membership_plans: MembershipPlan | null;
};

/** Devuelve todas las membresías (de todos los clientes) ordenadas por fecha de fin. */
export async function getAllMemberships(): Promise<MembershipWithRelations[]> {
  const { data, error } = await supabase
    .from("memberships")
    .select(`*, clients (*), membership_plans (*)`)
    .order("end_date", { ascending: false });

  if (error) throw new Error(`[clients.api] getAllMemberships: ${error.message}`);
  return (data ?? []) as MembershipWithRelations[];
}

/**
 * Crea una nueva membresía para un cliente con lógica de "plan stacking":
 * - Si el cliente ya tiene una membresía activa, el nuevo plan inicia
 *   al terminar el actual (no se pierden días).
 * - Si no tiene plan activo, inicia hoy.
 */
export async function createClientMembership(
  clientId: string,
  planId: string,
  durationDays: number
): Promise<Membership> {
  // Obtener la información del plan para verificar si tiene límite de ingresos
  const { data: plan, error: planError } = await supabase
    .from("membership_plans")
    .select("allowed_entries")
    .eq("id", planId)
    .single();

  if (planError) {
    throw new Error(`[clients.api] createClientMembership (fetch plan): ${planError.message}`);
  }

  // Buscar membresía activa vigente del cliente
  const { data: activeMemberships } = await supabase
    .from("memberships")
    .select("end_date")
    .eq("client_id", clientId)
    .eq("status", "active")
    .order("end_date", { ascending: false })
    .limit(1);

  // Si hay una membresía activa, encolar el nuevo plan después de ella
  const latestEndDate =
    activeMemberships && activeMemberships.length > 0
      ? new Date(activeMemberships[0].end_date)
      : null;

  const startDate = latestEndDate
    ? new Date(latestEndDate.getTime() + 1000) // 1 segundo después del plan actual
    : new Date();

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);

  const { data, error } = await supabase
    .from("memberships")
    .insert({
      client_id: clientId,
      plan_id: planId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
      allowed_entries: plan.allowed_entries ?? null,
      used_entries: 0,
    })
    .select()
    .single();

  if (error) throw new Error(`[clients.api] createClientMembership: ${error.message}`);
  return data as Membership;
}

/** Cancela una membresía activa. */
export async function cancelMembership(id: string): Promise<void> {
  const { error } = await supabase
    .from("memberships")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) throw new Error(`[clients.api] cancelMembership: ${error.message}`);
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
