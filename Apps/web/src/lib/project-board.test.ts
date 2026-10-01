import { describe, expect, it } from "vitest";
import {
  BOARD_CARDS,
  filterCards,
  moveCard,
  reconcileCardsWithKadCompletions,
  uiEpicProgress,
} from "./project-board";

describe("project board", () => {
  it("starts with pipeline column counts", () => {
    expect(BOARD_CARDS.filter((card) => card.status === "intake")).toHaveLength(34);
    expect(BOARD_CARDS.filter((card) => card.status === "development")).toHaveLength(2);
    expect(BOARD_CARDS.filter((card) => card.status === "done")).toHaveLength(4);
  });

  it("filters by title and issue number", () => {
    expect(filterCards(BOARD_CARDS, "RoomPicker")).toHaveLength(1);
    expect(filterCards(BOARD_CARDS, "#35")[0]?.number).toBe(35);
    expect(filterCards(BOARD_CARDS, "  ")).toHaveLength(BOARD_CARDS.length);
  });

  it("moves a card without changing the others", () => {
    const next = moveCard(BOARD_CARDS, 35, "done");
    expect(next.find((card) => card.number === 35)?.status).toBe("done");
    expect(next.find((card) => card.number === 30)?.status).toBe("development");
  });

  it("counts closed UI sub-issues for the epic bar", () => {
    expect(uiEpicProgress(BOARD_CARDS)).toEqual({ done: 4, total: 10 });
    expect(uiEpicProgress(moveCard(BOARD_CARDS, 35, "done"))).toEqual({
      done: 5,
      total: 10,
    });
  });

  it("reconciles UI-06 forward when KAD test completion exists", () => {
    const atIntake = moveCard(BOARD_CARDS, 36, "intake");
    const completed = {
      "36:development": { issueNumber: 36, pipelineStage: "development" },
      "36:test": { issueNumber: 36, pipelineStage: "test" },
    };
    const next = reconcileCardsWithKadCompletions(atIntake, completed);
    expect(next.find((c) => c.number === 36)?.status).toBe("audit");
  });

  it("reconciles to Test when only development completion exists", () => {
    const onDev = moveCard(BOARD_CARDS, 36, "development");
    const completed = {
      "36:development": { issueNumber: 36, pipelineStage: "development" },
    };
    const next = reconcileCardsWithKadCompletions(onDev, completed);
    expect(next.find((c) => c.number === 36)?.status).toBe("test");
  });
});
