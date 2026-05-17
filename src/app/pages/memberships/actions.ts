"use server";

import {
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
  cancelMembership,
} from "@/lib/api/clients.api";
import { revalidatePath } from "next/cache";
import type { MembershipPlan } from "@/lib/database.types";

const PATHS = ["/pages/memberships", "/pages/dashboard", "/pages/clients"];
const revalidateAll = () => PATHS.forEach((p) => revalidatePath(p));

export async function addPlanAction(
  input: Pick<MembershipPlan, "name" | "description" | "price" | "duration_days">
) {
  await createMembershipPlan(input);
  revalidateAll();
}

export async function editPlanAction(
  id: string,
  input: Partial<Pick<MembershipPlan, "name" | "description" | "price" | "duration_days">>
) {
  await updateMembershipPlan(id, input);
  revalidateAll();
}

export async function removePlanAction(id: string) {
  await deleteMembershipPlan(id);
  revalidateAll();
}

export async function cancelMembershipAction(id: string) {
  await cancelMembership(id);
  revalidateAll();
}
