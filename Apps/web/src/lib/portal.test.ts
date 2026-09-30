import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  isAdminPath,
  isAdminPortalHost,
  isPortalSplitEnabled,
  parseOrigin,
} from "./portal-shared";

describe("portal", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL = "http://localhost:3001";
  });

  afterEach(() => {
    process.env = env;
  });

  it("detects split when origins differ", () => {
    expect(isPortalSplitEnabled()).toBe(true);
    expect(parseOrigin("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("disables split when admin URL matches app URL", () => {
    process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL = "http://localhost:3000";
    expect(isPortalSplitEnabled()).toBe(false);
  });

  it("classifies admin paths and hosts", () => {
    expect(isAdminPath("/admin/scheduler")).toBe(true);
    expect(isAdminPath("/book")).toBe(false);
    expect(isAdminPortalHost("localhost:3001")).toBe(true);
    expect(isAdminPortalHost("localhost:3000")).toBe(false);
  });
});
