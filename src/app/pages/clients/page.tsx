import React from "react";
import { getClients, getClientStats } from "@/lib/api/clients.api";
import ClientsManager from "./ClientsManager";

// ─── Server Component (async) ─────────────────────────────────────────────────
export default async function ClientsPage() {
  const [clients, stats] = await Promise.all([
    getClients(),
    getClientStats(),
  ]);

  return <ClientsManager initialClients={clients} stats={stats} />;
}
