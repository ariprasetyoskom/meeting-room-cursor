"use client";

const STORAGE_KEY = "mrb_dev_user_id";

export function getDevUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setDevUserId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
}

export type ApiErrorBody = {
  code: string;
  message: string;
  message_en?: string;
  details?: unknown;
};

export class ApiError extends Error {
  code: string;
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.code = body.code;
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const userId = getDevUserId();
  if (userId) {
    headers.set("x-dev-user-id", userId);
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, {
      code: data.code ?? "UNKNOWN",
      message: data.message ?? "Permintaan gagal.",
      message_en: data.message_en,
      details: data.details,
    });
  }

  return data as T;
}

export type Room = {
  id: string;
  code: string;
  name: string;
  floor: string | null;
  capacity: number;
  amenities: string[];
};

export type BookingRow = {
  id: string;
  roomId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: "confirmed" | "cancelled";
  organizerUserId: string;
  organizerName: string;
};
