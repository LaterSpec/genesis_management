import React from "react";
import { getProducts, getCategories } from "@/lib/api/inventory.api";
import { getMembershipPlans, getClientsForPOS, getVisitorClientId } from "@/lib/api/clients.api";
import SalesManager from "./SalesManager";

// ─── Server Component (async) ─────────────────────────────────────────────────
export default async function SalesPage() {
  const [products, , plans, clients, visitorId] = await Promise.all([
    getProducts(),
    getCategories(),
    getMembershipPlans(),
    getClientsForPOS(),
    getVisitorClientId(),
  ]);

  return (
    <SalesManager
      products={products}
      plans={plans}
      clients={clients}
      visitorId={visitorId}
    />
  );
}
