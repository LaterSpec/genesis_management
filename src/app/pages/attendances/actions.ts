"use server";

import {
  createAttendance,
  deleteAttendance,
  getAttendanceDayList,
  type AttendanceWarningReason,
} from "@/lib/api/attendance.api";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const PATHS = ["/pages/attendances", "/pages/dashboard", "/pages/activity_log"];

function revalidateAll() {
  PATHS.forEach((path) => revalidatePath(path));
}

export interface RegisterAttendanceActionResult {
  success: boolean;
  requiresConfirmation?: boolean;
  warningReason?: AttendanceWarningReason;
  message?: string;
}

export async function getAttendanceDayListAction(date: string) {
  return getAttendanceDayList(date);
}

export async function registerAttendanceAction(input: {
  clientId: string;
  force?: boolean;
}): Promise<RegisterAttendanceActionResult> {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await createAttendance({
    clientId: input.clientId,
    userId: user?.id,
    force: input.force,
  });

  if (result.success) {
    revalidateAll();
  }

  return {
    success: result.success,
    requiresConfirmation: result.requiresConfirmation,
    warningReason: result.warningReason,
    message: result.message,
  };
}

export async function deleteAttendanceAction(attendanceId: string) {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await deleteAttendance({
    attendanceId,
    userId: user?.id,
  });

  revalidateAll();
}
