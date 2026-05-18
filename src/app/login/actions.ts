"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const AUTH_UNAVAILABLE_MESSAGE =
  "No se pudo conectar con el servicio de autenticacion. Verifica que Supabase local este iniciado.";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  let authResponse;

  try {
    authResponse = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  } catch (error) {
    console.error("[LOGIN NETWORK ERROR]", {
      email,
      error,
    });
    return redirect(
      `/login?message=${encodeURIComponent(AUTH_UNAVAILABLE_MESSAGE)}`
    );
  }

  const { data, error } = authResponse;

  if (error) {
    console.error("[LOGIN ERROR]", {
      message: error.message,
      status: error.status,
      code: error.code,
      email,
    });
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  console.log("[LOGIN SUCCESS] user:", data.user?.email);
  return redirect("/pages/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/login");
}
