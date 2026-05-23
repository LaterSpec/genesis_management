/**
 * users.api.ts
 * ─────────────────────────────────────────────────────────────
 * Dominio: Administración de Personal / Gestión de Usuarios.
 * Solo se usa en Server Components / Server Actions (no exponer a cliente).
 */

import { createClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Inicializa un cliente de Supabase del lado del servidor utilizando la llave secreta Service Role.
 * Esto permite realizar operaciones administrativas de Auth (como crear y eliminar usuarios sin desloguear).
 */
export function getServiceRoleClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está definida en las variables de entorno.");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface StaffMember extends Profile {
  email: string;
}

export interface CreateStaffInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  birth_date?: string;
  gender?: string;
  role?: "administrator" | "receptionist";
}

/**
 * Obtiene la lista unificada de todo el personal cruzando la tabla de perfiles 'profiles'
 * con los correos electrónicos de 'auth.users' de forma administrativa.
 */
export async function getStaffList(options?: { includeInactive?: boolean }): Promise<StaffMember[]> {
  const serviceClient = getServiceRoleClient();

  // 1. Obtener los perfiles (por defecto solo activos)
  let query = serviceClient.from("profiles").select("*");
  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data: profiles, error: profilesError } = await query
    .order("created_at", { ascending: false });

  if (profilesError) {
    throw new Error(`[users.api] getStaffList (profiles): ${profilesError.message}`);
  }

  // 2. Obtener las cuentas de autenticación
  const { data: { users }, error: authError } = await serviceClient.auth.admin.listUsers();

  if (authError) {
    throw new Error(`[users.api] getStaffList (auth): ${authError.message}`);
  }

  // 3. Combinar ambos conjuntos de datos en memoria
  return (profiles ?? []).map((profile) => {
    const authUser = users.find((u) => u.id === profile.id);
    return {
      ...profile,
      email: authUser?.email ?? "—",
    } as StaffMember;
  });
}

/**
 * Registra una cuenta de personal (recepcionista o administrador) con email pre-confirmado.
 * Implementa rollback automático: si falla la creación del perfil en base de datos,
 * borra la cuenta en auth para evitar registros huérfanos.
 */
export async function createStaffUser(input: CreateStaffInput): Promise<StaffMember> {
  const serviceClient = getServiceRoleClient();

  // 1. Crear usuario en auth con confirmación automática
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      first_name: input.first_name,
      last_name: input.last_name,
    },
  });

  if (authError) {
    throw new Error(`[users.api] createStaffUser (auth): ${authError.message}`);
  }

  const newUserId = authData.user.id;

  // 2. Crear su registro de perfil en la base de datos
  try {
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .insert({
        id: newUserId,
        first_name: input.first_name,
        last_name: input.last_name,
        role: input.role || "receptionist",
        birth_date: input.birth_date || null,
        gender: input.gender || null,
        is_active: true,
        registration_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(profileError.message);
    }

    return {
      ...profile,
      email: input.email,
    } as StaffMember;
  } catch (error: any) {
    // ROLLBACK: Borrar el usuario de autenticación si el insert de perfiles falló
    await serviceClient.auth.admin.deleteUser(newUserId);
    throw new Error(`[users.api] createStaffUser (profiles-rollback): ${error.message}`);
  }
}

/**
 * Desactiva una cuenta de personal en la tabla de perfiles (Soft Delete)
 * para mantener la integridad referencial en registros históricos.
 */
export async function deleteStaffUser(userId: string): Promise<void> {
  const serviceClient = getServiceRoleClient();
  const { error } = await serviceClient
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId);

  if (error) {
    throw new Error(`[users.api] deleteStaffUser: ${error.message}`);
  }
}

/**
 * Actualiza administrativamente la contraseña de un miembro del personal.
 */
export async function updateStaffPassword(userId: string, newPassword: string): Promise<void> {
  const serviceClient = getServiceRoleClient();
  const { error } = await serviceClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    throw new Error(`[users.api] updateStaffPassword: ${error.message}`);
  }
}
