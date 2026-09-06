#!/usr/bin/env node
// Stop hook — appends Claude's final response text for the turn that just
// ended to this session's .agent-logs/*.md file. Uses `last_assistant_message`
// (provided directly on the Stop hook's stdin JSON) rather than parsing
// transcript_path, because Claude Code's docs note the transcript file is
// written asynchronously and can lag the in-memory conversation at Stop time.
// Never blocks: always exits 0, silently, and never returns a `decision`.
import {
  appendEntry,
  countEntries,
  findOrCreateSessionLogFile,
  touchFrontmatter,
} from "./lib.mjs";

try {
  const raw = await new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
  const input = JSON.parse(raw);

  const sessionId = input.session_id;
  const response = input.last_assistant_message ?? "";
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

  if (!sessionId) process.exit(0);
  // stop_hook_active === true means Claude Code is already continuing because
  // of a stop hook's decision; we never issue that decision ourselves, but
  // skip logging a duplicate entry defensively if we ever see it re-fire.
  if (input.stop_hook_active) process.exit(0);

  const now = new Date();
  const nowIso = now.toISOString();

  // The log file should already exist (created by capture-prompt.mjs for
  // this same session); findOrCreate covers the edge case where Stop fires
  // without a matching prompt entry we know about.
  const fpath = findOrCreateSessionLogFile(projectDir, sessionId, nowIso, now);
  const num = countEntries(fpath, "RESPONSE") + 1;

  appendEntry(fpath, {
    type: "RESPONSE",
    num,
    sessionId,
    timestamp: nowIso,
    body: response,
  });

  touchFrontmatter(fpath, { lastPromptTime: nowIso });
} catch (err) {
  try {
    process.stderr.write(`capture-response hook error: ${err?.stack || err}\n`);
  } catch {}
}
process.exit(0);
