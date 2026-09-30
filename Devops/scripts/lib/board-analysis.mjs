/**
 * Analisis kartu Project vs state issue GitHub.
 */

export function analyzeBoard(items, issueStates) {
  /** @type {Array<{number:number,title:string,url?:string,milestone?:string,labels?:string[],boardStatus:string}>} */
  const inProgress = [];
  /** Closed issue masih In Progress di board */
  /** @type {typeof inProgress} */
  const driftClosedInProgress = [];
  /** Open issue kartu Done (informasi) */
  /** @type {typeof inProgress} */
  const driftOpenDone = [];

  for (const item of items) {
    const content = item.content;
    if (!content || content.type !== "Issue" || content.number == null) continue;

    const n = content.number;
    const issueState = issueStates.get(n);
    const boardStatus = item.status || "Todo";
    const row = {
      number: n,
      title: item.title || content.title || `#${n}`,
      url: content.url,
      milestone: item.milestone?.title,
      labels: item.labels,
      boardStatus,
      issueState: issueState ?? "UNKNOWN",
    };

    if (boardStatus === "In Progress") {
      inProgress.push(row);
      if (issueState === "CLOSED") driftClosedInProgress.push(row);
    }
    if (issueState === "OPEN" && boardStatus === "Done") {
      driftOpenDone.push(row);
    }
  }

  inProgress.sort((a, b) => a.number - b.number);
  driftClosedInProgress.sort((a, b) => a.number - b.number);

  return { inProgress, driftClosedInProgress, driftOpenDone };
}

export function formatTextReport(analysis, meta) {
  const lines = [];
  lines.push(`# Project scheduler (${meta.timestamp})`);
  lines.push(`Owner: ${meta.owner} · Project #${meta.projectNumber}`);
  lines.push("");

  lines.push(`## In Progress (${analysis.inProgress.length})`);
  if (analysis.inProgress.length === 0) {
    lines.push("(tidak ada kartu In Progress)");
  } else {
    for (const row of analysis.inProgress) {
      lines.push(`- #${row.number} ${row.title}`);
      if (row.url) lines.push(`  ${row.url}`);
      if (row.milestone) lines.push(`  milestone: ${row.milestone}`);
    }
  }
  lines.push("");

  lines.push(`## Drift — issue closed, board bukan Done (${analysis.driftClosedInProgress.length})`);
  if (analysis.driftClosedInProgress.length === 0) {
    lines.push("(ok)");
  } else {
    for (const row of analysis.driftClosedInProgress) {
      lines.push(`- #${row.number} board=${row.boardStatus} issue=CLOSED → jalankan sync`);
    }
  }

  if (analysis.driftOpenDone.length > 0) {
    lines.push("");
    lines.push(`## Catatan — issue open, board Done (${analysis.driftOpenDone.length})`);
    for (const row of analysis.driftOpenDone) {
      lines.push(`- #${row.number} ${row.title}`);
    }
  }

  return lines.join("\n");
}
