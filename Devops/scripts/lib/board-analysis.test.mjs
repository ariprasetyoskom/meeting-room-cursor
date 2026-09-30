import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeBoard } from "./board-analysis.mjs";

describe("analyzeBoard", () => {
  it("lists In Progress open issues", () => {
    const items = [
      {
        status: "In Progress",
        title: "UI-05",
        content: { type: "Issue", number: 35, url: "https://example/35" },
      },
    ];
    const states = new Map([[35, "OPEN"]]);
    const r = analyzeBoard(items, states);
    assert.equal(r.inProgress.length, 1);
    assert.equal(r.driftClosedInProgress.length, 0);
  });

  it("detects closed issue still In Progress", () => {
    const items = [
      {
        status: "In Progress",
        content: { type: "Issue", number: 33 },
      },
    ];
    const states = new Map([[33, "CLOSED"]]);
    const r = analyzeBoard(items, states);
    assert.equal(r.driftClosedInProgress.length, 1);
    assert.equal(r.driftClosedInProgress[0].number, 33);
  });
});
