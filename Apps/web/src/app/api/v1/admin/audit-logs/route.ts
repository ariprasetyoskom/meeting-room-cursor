import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api-response";
import { handleAdminRouteError } from "@/lib/api-admin-errors";
import { listAuditLogs } from "@/db/repositories/audit.repository";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const result = await listAuditLogs({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(`${to}T23:59:59.999+07:00`) : undefined,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    return jsonOk({
      logs: result.rows.map((log) => ({
        id: log.id,
        actorUserId: log.actorUserId,
        actorName: log.actorName,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        payload: log.payload,
        createdAt: log.createdAt,
      })),
      total: result.total,
    });
  } catch (err) {
    return handleAdminRouteError(err);
  }
}
