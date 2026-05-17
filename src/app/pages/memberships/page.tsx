import React from "react";
import { getMembershipPlans, getAllMemberships } from "@/lib/api/clients.api";
import MembershipsManager from "./MembershipsManager";

// ─── Server Component (async) ─────────────────────────────────────────────────
export default async function MembershipsPage() {
  const [plans, memberships] = await Promise.all([
    getMembershipPlans(),
    getAllMemberships(),
  ]);

  return <MembershipsManager initialPlans={plans} initialMemberships={memberships} />;
}
