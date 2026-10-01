import { describe, expect, it } from "vitest";
import { buildAgentPrompt } from "./board-dispatch";
import { BOARD_DISPATCH_STAGE } from "./project-board";

describe("board dispatch prompt", () => {
  const issue = {
    number: 35,
    title: "[UI-05] BookingCalendar",
    body: "Acceptance: scroll daftar.",
    html_url: "https://github.com/o/r/issues/35",
    state: "open",
  };

  it("mentions pipeline stage and fromStage", () => {
    const prompt = buildAgentPrompt(issue, "o/r", "intake", "development");
    expect(prompt).toContain("#35");
    expect(prompt).toContain(BOARD_DISPATCH_STAGE);
    expect(prompt).toContain("intake");
    expect(prompt).toContain("Intake → Plan → Development");
  });

  it("works without fromStage", () => {
    const prompt = buildAgentPrompt(issue, "o/r", null, "development");
    expect(prompt).toContain(BOARD_DISPATCH_STAGE);
    expect(prompt).not.toContain("dipindah dari");
  });

  it("includes test stage instructions", () => {
    const prompt = buildAgentPrompt(issue, "o/r", "development", "test");
    expect(prompt).toContain("**Test**");
    expect(prompt.toLowerCase()).toContain("verifikasi");
  });
});
