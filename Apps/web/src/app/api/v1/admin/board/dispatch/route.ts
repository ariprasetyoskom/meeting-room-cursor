import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { handleAdminRouteError } from "@/lib/api-admin-errors";
import {
  clearDispatchLock,
  dispatchBoardIssue,
  DispatchNotConfiguredError,
  DispatchRejectedError,
  DispatchWebhookError,
  getDispatchStatus,
} from "@/lib/board-dispatch";

const boardStageSchema = z.enum([
  "intake",
  "plan",
  "development",
  "test",
  "audit",
  "human_clarify",
  "human_qa",
  "done",
]);

const postSchema = z.object({
  issueNumber: z.number().int().positive(),
  fromStage: boardStageSchema.optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const status = await getDispatchStatus();
    return NextResponse.json(status);
  } catch (e) {
    return handleAdminRouteError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = postSchema.parse(await request.json());
    try {
      const result = await dispatchBoardIssue(
        body.issueNumber,
        body.fromStage ?? null,
      );
      return NextResponse.json(result, { status: 202 });
    } catch (e) {
      if (e instanceof DispatchNotConfiguredError) {
        return NextResponse.json({ error: e.message }, { status: 503 });
      }
      if (e instanceof DispatchRejectedError) {
        const status = e.code === "DEBOUNCE" ? 429 : 409;
        return NextResponse.json({ error: e.message, code: e.code }, { status });
      }
      if (e instanceof DispatchWebhookError) {
        return NextResponse.json({ error: e.message }, { status: 502 });
      }
      throw e;
    }
  } catch (e) {
    return handleAdminRouteError(e);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);
    await clearDispatchLock();
    return NextResponse.json({ cleared: true });
  } catch (e) {
    return handleAdminRouteError(e);
  }
}
