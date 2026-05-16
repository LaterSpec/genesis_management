"use server";

import { createClient, updateClient, deleteClient } from "@/lib/api/clients.api";
import { revalidatePath } from "next/cache";
import type { Client } from "@/lib/database.types";

export async function addClientAction(input: Pick<Client, "first_name" | "last_name" | "email" | "dni" | "phone">) {
  await createClient(input);
  revalidatePath("/pages/clients");
  revalidatePath("/pages/dashboard");
}

export async function editClientAction(id: string, input: Partial<Pick<Client, "first_name" | "last_name" | "email" | "dni" | "phone" | "status">>) {
  await updateClient(id, input);
  revalidatePath("/pages/clients");
  revalidatePath("/pages/dashboard");
}

export async function removeClientAction(id: string) {
  await deleteClient(id);
  revalidatePath("/pages/clients");
  revalidatePath("/pages/dashboard");
}
