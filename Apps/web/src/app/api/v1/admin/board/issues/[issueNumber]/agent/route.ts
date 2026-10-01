import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { handleAdminRouteError } from "@/lib/api-admin-errors";
import { getIssueAgentDetail } from "@/lib/board-dispatch";

type RouteContext = { params: Promise<{ issueNumber: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    const { issueNumber: raw } = await context.params;
    const issueNumber = Number(raw);
    if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
      return NextResponse.json({ error: "Nomor issue tidak valid." }, { status: 400 });
    }
    const stageParam = request.nextUrl.searchParams.get("stage");
    const contextStage =
      stageParam === "test" ||
      stageParam === "development" ||
      stageParam === "audit"
        ? stageParam
        : "development";
    const detail = await getIssueAgentDetail(issueNumber, contextStage);
    return NextResponse.json(detail);
  } catch (e) {
    return handleAdminRouteError(e);
  }
}
