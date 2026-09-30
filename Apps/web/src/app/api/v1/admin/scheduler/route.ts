import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { handleAdminRouteError } from "@/lib/api-admin-errors";
import {
  getSchedulerStatus,
  SchedulerNotConfiguredError,
  updateSchedulerSettings,
} from "@/lib/github-scheduler";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  syncOnSchedule: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const status = await getSchedulerStatus();
    return NextResponse.json(status);
  } catch (e) {
    return handleAdminRouteError(e);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = patchSchema.parse(await request.json());
    if (body.enabled === undefined && body.syncOnSchedule === undefined) {
      return NextResponse.json(
        { error: "Tidak ada field yang diubah." },
        { status: 400 },
      );
    }
    try {
      const status = await updateSchedulerSettings(body);
      return NextResponse.json(status);
    } catch (e) {
      if (e instanceof SchedulerNotConfiguredError) {
        return NextResponse.json({ error: e.message }, { status: 503 });
      }
      throw e;
    }
  } catch (e) {
    return handleAdminRouteError(e);
  }
}
