import React from "react";
import { getStaffList } from "@/lib/api/users.api";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import StaffManager from "./StaffManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Server Component principal de la ruta de Administración de Personal.
 * Valida la sesión del servidor y restringe el acceso solo a administradores.
 */
export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Validar rol de administrador en el servidor
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "administrator") {
    redirect("/pages/dashboard");
  }

  // Obtener la lista unificada del personal
  const staff = await getStaffList();

  return <StaffManager initialStaff={staff} currentUserId={user.id} />;
}
