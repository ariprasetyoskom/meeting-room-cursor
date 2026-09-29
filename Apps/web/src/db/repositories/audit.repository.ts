import { and, desc, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, type AuditLog } from "@/db/schema";

export type AuditLogRow = AuditLog & {
  actorName: string | null;
};

export async function listAuditLogs(params: {
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ rows: AuditLogRow[]; total: number }> {
  const conditions = [];
  if (params.from) {
    conditions.push(gte(auditLogs.createdAt, params.from));
  }
  if (params.to) {
    conditions.push(lte(auditLogs.createdAt, params.to));
  }

  const rows = await db.query.auditLogs.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { actor: true },
    orderBy: desc(auditLogs.createdAt),
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
  });

  const all = await db.query.auditLogs.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    columns: { id: true },
  });

  return {
    rows: rows.map((r) => ({
      ...r,
      actorName: r.actor?.displayName ?? null,
    })),
    total: all.length,
  };
}
