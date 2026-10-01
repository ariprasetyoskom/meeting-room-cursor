import { describe, expect, it } from "vitest";
import { resolveDevelopmentLogDir } from "./development-log";

describe("development log paths", () => {
  it("defaults to Development/logs under monorepo root from Apps/web cwd", () => {
    const dir = resolveDevelopmentLogDir().replace(/\\/g, "/");
    expect(dir.endsWith("/Development/logs")).toBe(true);
  });

  it("honors DEVELOPMENT_LOG_DIR", () => {
    const prev = process.env.DEVELOPMENT_LOG_DIR;
    process.env.DEVELOPMENT_LOG_DIR = "D:/tmp/dev-logs";
    expect(resolveDevelopmentLogDir()).toBe("D:\\tmp\\dev-logs");
    if (prev === undefined) delete process.env.DEVELOPMENT_LOG_DIR;
    else process.env.DEVELOPMENT_LOG_DIR = prev;
  });
});
