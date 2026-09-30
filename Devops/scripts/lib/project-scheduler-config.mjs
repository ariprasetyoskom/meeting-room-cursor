/** Konfigurasi bersama — selaras PRD-GitHub-Project-Scheduler §9 */

export function loadSchedulerConfig() {
  return {
    owner: process.env.PROJECT_OWNER || "@me",
    projectNumber: process.env.PROJECT_NUMBER || "1",
    repo: process.env.GITHUB_REPO || "ariprasetyoskom/meeting-room-cursor",
    syncDelayMs: Number(process.env.PROJECT_SYNC_DELAY_MS || "600"),
    syncMaxUpdates: Number(process.env.PROJECT_SYNC_MAX_UPDATES || "25"),
    failOnDrift: process.env.PROJECT_FAIL_ON_DRIFT === "true",
  };
}
