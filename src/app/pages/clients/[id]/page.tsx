import React from "react";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { getClientById } from "@/lib/api/clients.api";
import { getSalesByClientId } from "@/lib/api/sales.api";
import { getAttendancesByClientId } from "@/lib/api/attendance.api";
import ClientDetailsManager from "./ClientDetailsManager";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  // 1. Auth Guard
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Extract id from params
  const { id } = await params;

  // 3. Fetch data in parallel on the server (BFF Architecture)
  const [client, sales, attendances] = await Promise.all([
    getClientById(id),
    getSalesByClientId(id),
    getAttendancesByClientId(id),
  ]);

  // 4. Redirect if client not found
  if (!client) {
    redirect("/pages/clients");
  }

  return (
    <ClientDetailsManager
      client={client}
      initialSales={sales}
      initialAttendances={attendances}
    />
  );
}
