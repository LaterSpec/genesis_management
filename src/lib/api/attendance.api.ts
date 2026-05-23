/**
 * attendance.api.ts
 * ─────────────────────────────────────────────────────────────
 * Dominio: Registro de asistencias de clientes.
 */

import { supabase } from "@/lib/supabase/client";
import { logAction } from "@/lib/api/logs.api";
import type {
  Client,
  ClientAttendance,
  Membership,
  MembershipPlan,
  Profile,
} from "@/lib/database.types";

export type AttendanceWarningReason =
  | "inactive_client"
  | "no_active_membership"
  | "both";

type MembershipRelation = Membership & {
  membership_plans: MembershipPlan | null;
};

type ClientWithMemberships = Client & {
  memberships: MembershipRelation[];
};

export interface AttendanceClientLookup {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  email: string | null;
  phone: string | null;
  status: string;
  activeMembership: {
    id: string;
    planName: string;
    endDate: string;
    usedEntries?: number;
    allowedEntries?: number | null;
  } | null;
  warningReason: AttendanceWarningReason | null;
}

export type ClientAttendanceFull = ClientAttendance & {
  clients: (Pick<Client, "id" | "first_name" | "last_name" | "dni" | "status"> & {
    memberships?: MembershipRelation[];
  }) | null;
  profiles: Pick<Profile, "id" | "first_name" | "last_name" | "role"> | null;
};

export interface CreateAttendanceResult {
  success: boolean;
  requiresConfirmation?: boolean;
  warningReason?: AttendanceWarningReason;
  message?: string;
  attendanceId?: string;
}

const ATTENDANCE_TIMEZONE = "America/Lima";

function formatAttendanceDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ATTENDANCE_TIMEZONE,
  }).format(date);
}

function isMembershipActive(membership: Membership, referenceDate: Date) {
  if (membership.status !== "active") return false;

  // Si tiene límite de ingresos y ya los agotó, está inactiva
  if (membership.allowed_entries !== null && membership.allowed_entries !== undefined) {
    if (membership.used_entries >= membership.allowed_entries) {
      return false;
    }
  }

  const start = new Date(membership.start_date).getTime();
  const end = new Date(membership.end_date).getTime();
  const current = referenceDate.getTime();

  return start <= current && end >= current;
}

function findActiveMembership(
  memberships: MembershipRelation[] | undefined,
  referenceDate: Date
) {
  if (!memberships?.length) return null;

  return (
    memberships.find((membership) => isMembershipActive(membership, referenceDate)) ??
    null
  );
}

function getWarningReason(
  clientStatus: string,
  activeMembership: MembershipRelation | null
): AttendanceWarningReason | null {
  const inactiveClient = clientStatus !== "active";
  const missingMembership = !activeMembership;

  if (inactiveClient && missingMembership) return "both";
  if (inactiveClient) return "inactive_client";
  if (missingMembership) return "no_active_membership";
  return null;
}

function mapLookupClient(
  client: ClientWithMemberships,
  referenceDate: Date
): AttendanceClientLookup {
  const activeMembership = findActiveMembership(client.memberships, referenceDate);

  return {
    id: client.id,
    first_name: client.first_name,
    last_name: client.last_name,
    dni: client.dni,
    email: client.email,
    phone: client.phone,
    status: client.status,
    activeMembership: activeMembership
      ? {
          id: activeMembership.id,
          planName: activeMembership.membership_plans?.name ?? "Sin plan",
          endDate: activeMembership.end_date,
          usedEntries: activeMembership.used_entries,
          allowedEntries: activeMembership.allowed_entries,
        }
      : null,
    warningReason: getWarningReason(client.status, activeMembership),
  };
}

async function getAttendanceClientById(clientId: string, referenceDate: Date) {
  const { data, error } = await supabase
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
    .eq("id", clientId)
    .neq("dni", "00000000")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`[attendance.api] getAttendanceClientById: ${error.message}`);
  }

  return mapLookupClient(data as ClientWithMemberships, referenceDate);
}

export async function getAttendanceClients(): Promise<AttendanceClientLookup[]> {
  const referenceDate = new Date();
  const { data, error } = await supabase
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
    .neq("dni", "00000000")
    .order("first_name", { ascending: true });

  if (error) throw new Error(`[attendance.api] getAttendanceClients: ${error.message}`);
  return (data ?? []).map((client: any) =>
    mapLookupClient(client as ClientWithMemberships, referenceDate)
  );
}

export async function searchClientsForAttendance(
  query: string
): Promise<AttendanceClientLookup[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const clients = await getAttendanceClients();
  return clients
    .filter((client) => {
      const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
      return fullName.includes(normalizedQuery) || client.dni.includes(normalizedQuery);
    })
    .slice(0, 10);
}

export async function getAttendanceDayList(
  attendanceDate: string
): Promise<ClientAttendanceFull[]> {
  const { data, error } = await supabase
    .from("client_attendances")
    .select(
      `
      *,
      clients (
        id,
        first_name,
        last_name,
        dni,
        status,
        memberships (
          *,
          membership_plans (*)
        )
      ),
      profiles (id, first_name, last_name, role)
    `
    )
    .eq("attendance_date", attendanceDate)
    .order("attendance_at", { ascending: false });

  if (error) throw new Error(`[attendance.api] getAttendanceDayList: ${error.message}`);
  return (data ?? []) as ClientAttendanceFull[];
}

export async function getAttendanceDayStats(attendanceDate: string) {
  const rows = await getAttendanceDayList(attendanceDate);
  const uniqueClients = new Set(rows.map((row) => row.client_id)).size;

  return {
    totalEntries: rows.length,
    uniqueClients,
  };
}

export async function createAttendance(input: {
  clientId: string;
  userId?: string;
  force?: boolean;
}): Promise<CreateAttendanceResult> {
  const now = new Date();
  const client = await getAttendanceClientById(input.clientId, now);

  if (!client) {
    return {
      success: false,
      message: "El cliente seleccionado no existe.",
    };
  }

  const warningReason = client.warningReason;
  if (warningReason && !input.force) {
    return {
      success: false,
      requiresConfirmation: true,
      warningReason,
      message: "La asistencia requiere confirmación por estado del cliente o membresía.",
    };
  }

  const attendanceDate = formatAttendanceDate(now);
  const { data, error } = await supabase
    .from("client_attendances")
    .insert({
      client_id: input.clientId,
      registered_by: input.userId ?? null,
      attendance_at: now.toISOString(),
      attendance_date: attendanceDate,
    })
    .select()
    .single();

  if (error) throw new Error(`[attendance.api] createAttendance: ${error.message}`);

  const clientName = `${client.first_name} ${client.last_name}`;
  if (warningReason) {
    await logAction({
      action_type: "ATTENDANCE_WARNING_APPROVED",
      description: `Ingreso aprobado manualmente para ${clientName}`,
      user_id: input.userId,
      client_id: input.clientId,
    });
  }

  await logAction({
    action_type: "ATTENDANCE_REGISTERED",
    description: `Ingreso registrado para ${clientName}`,
    user_id: input.userId,
    client_id: input.clientId,
  });

  return {
    success: true,
    attendanceId: data.id,
    message: "Asistencia registrada correctamente.",
  };
}

export async function deleteAttendance(input: {
  attendanceId: string;
  userId?: string;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("client_attendances")
    .select(
      `
      id,
      client_id,
      attendance_at,
      clients (first_name, last_name)
    `
    )
    .eq("id", input.attendanceId)
    .single();

  if (existingError) {
    throw new Error(`[attendance.api] deleteAttendance (lookup): ${existingError.message}`);
  }

  const { error } = await supabase
    .from("client_attendances")
    .delete()
    .eq("id", input.attendanceId);

  if (error) throw new Error(`[attendance.api] deleteAttendance: ${error.message}`);

  const clientData = existing?.clients as any;
  const clientName =
    clientData && !Array.isArray(clientData)
      ? `${clientData.first_name} ${clientData.last_name}`
      : `cliente #${existing.client_id}`;

  await logAction({
    action_type: "ATTENDANCE_DELETED",
    description: `Asistencia eliminada para ${clientName}`,
    user_id: input.userId,
    client_id: existing.client_id,
  });
}
