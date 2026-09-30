import { describe, expect, it } from "vitest";
import {
  BOARD_CARDS,
  filterCards,
  moveCard,
  uiEpicProgress,
} from "./project-board";

describe("project board", () => {
  it("starts with the Project #1 column counts", () => {
    expect(BOARD_CARDS.filter((card) => card.status === "todo")).toHaveLength(34);
    expect(BOARD_CARDS.filter((card) => card.status === "in_progress")).toHaveLength(2);
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
    expect(next.find((card) => card.number === 30)?.status).toBe("in_progress");
  });

  it("counts closed UI sub-issues for the epic bar", () => {
    expect(uiEpicProgress(BOARD_CARDS)).toEqual({ done: 4, total: 10 });
    expect(uiEpicProgress(moveCard(BOARD_CARDS, 35, "done"))).toEqual({
      done: 5,
      total: 10,
    });
  });
});
