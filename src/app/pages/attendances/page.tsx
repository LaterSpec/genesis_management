import React from "react";
import {
  getAttendanceClients,
  getAttendanceDayList,
} from "@/lib/api/attendance.api";
import AttendanceManager from "./AttendanceManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getTodayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
  }).format(new Date());
}

export default async function AttendancesPage() {
  const today = getTodayDate();
  const [clients, initialAttendances] = await Promise.all([
    getAttendanceClients(),
    getAttendanceDayList(today),
  ]);

  return (
    <AttendanceManager
      clients={clients}
      initialAttendances={initialAttendances}
      initialDate={today}
      todayDate={today}
    />
  );
}
