"use server";

import { updateClient } from "@/lib/api/clients.api";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/api/logs.api";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";

export async function updateClientNotesAction(id: string, notes: string | null) {
  // Guard against unauthenticated users
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await updateClient(id, { notes });
  
  // Revalidate paths
  revalidatePath("/pages/clients");
  revalidatePath(`/pages/clients/${id}`);

  // Fetch client info to log nicely
  const { data: client } = await supabase
    .from("clients")
    .select("first_name, last_name")
    .eq("id", id)
    .single();

  const clientName = client ? `${client.first_name} ${client.last_name}` : `cliente #${id}`;
  
  await logAction({
    action_type: "CLIENT_NOTES_UPDATED",
    description: `Notas actualizadas para el cliente ${clientName}`,
    user_id: user.id,
    client_id: id,
  });

  return { success: true };
}
