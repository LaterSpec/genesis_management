import React from "react";
import { getTransactions, getFinancialSummary, getDailyFinancialData } from "@/lib/api/finances.api";
import { getCashSessions } from "@/lib/api/cash-sessions.api";
import { getStaffList } from "@/lib/api/users.api";
import FinanceManager from "./FinanceManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── Server Component (async) ─────────────────────────────────────────────────
export default async function FinancesPage() {
  const [summary, transactions, weeklyData, initialSessions, staffList] = await Promise.all([
    getFinancialSummary(),
    getTransactions({ limit: 10 }),
    getDailyFinancialData(7),
    getCashSessions(),
    getStaffList({ includeInactive: true }),
  ]);

  return (
    <FinanceManager
      summary={summary}
      transactions={transactions}
      weeklyData={weeklyData}
      initialSessions={initialSessions}
      staffList={staffList}
    />
  );
}
