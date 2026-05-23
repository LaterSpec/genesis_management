"use server";

import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { getStaffList, createStaffUser, deleteStaffUser, updateStaffPassword } from "@/lib/api/users.api";
import { logAction } from "@/lib/api/logs.api";
import { revalidatePath } from "next/cache";
import type { StaffMember, CreateStaffInput } from "@/lib/api/users.api";

const PATHS_TO_REVALIDATE = ["/pages/staff", "/pages/dashboard", "/pages/activity_log"];

function revalidateAll() {
  PATHS_TO_REVALIDATE.forEach((path) => revalidatePath(path));
}

/**
 * Verifica la autenticación del usuario actual y que este cuente con rol de administrador.
 */
async function checkAdminAuthorization() {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No autenticado en el sistema.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "administrator") {
    throw new Error("No autorizado. Se requieren privilegios de administrador.");
  }

  return user;
}

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action para obtener la lista unificada del personal.
 */
export async function getStaffAction(): Promise<ActionResponse<StaffMember[]>> {
  try {
    await checkAdminAuthorization();
    const staff = await getStaffList();
    return { success: true, data: staff };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Server Action para crear un nuevo usuario con rol de recepcionista o administrador.
 */
export async function createStaffAction(input: CreateStaffInput): Promise<ActionResponse<StaffMember>> {
  try {
    const adminUser = await checkAdminAuthorization();

    if (!input.password || input.password.length < 6) {
      return { success: false, error: "La contraseña debe contener al menos 6 caracteres." };
    }

    const newStaff = await createStaffUser(input);

    await logAction({
      user_id: adminUser.id,
      action_type: "STAFF_CREATED",
      description: `Creó la cuenta de ${input.role === "administrator" ? "administrador" : "recepcionista"} para: ${input.first_name} ${input.last_name} (${input.email})`,
    });

    revalidateAll();
    return { success: true, data: newStaff };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Server Action para dar de baja (desactivar) una cuenta de personal.
 */
export async function deleteStaffAction(userId: string): Promise<ActionResponse<void>> {
  try {
    const adminUser = await checkAdminAuthorization();

    if (adminUser.id === userId) {
      return { success: false, error: "Operación inválida. No puedes auto-eliminarte." };
    }

    await deleteStaffUser(userId);

    await logAction({
      user_id: adminUser.id,
      action_type: "STAFF_DELETED",
      description: `Dio de baja (desactivó) al personal con ID: ${userId}`,
    });

    revalidateAll();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Server Action para actualizar la contraseña de un usuario recepcionista.
 */
export async function changeStaffPasswordAction(userId: string, newPassword: string): Promise<ActionResponse<void>> {
  try {
    const adminUser = await checkAdminAuthorization();

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "La nueva contraseña debe contener al menos 6 caracteres." };
    }

    await updateStaffPassword(userId, newPassword);

    await logAction({
      user_id: adminUser.id,
      action_type: "STAFF_PASSWORD_CHANGED",
      description: `Modificó la contraseña del personal con ID: ${userId}`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
