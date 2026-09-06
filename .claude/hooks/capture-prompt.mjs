#!/usr/bin/env node
// UserPromptSubmit hook — appends the verbatim prompt to this session's
// .agent-logs/*.md file. Never blocks the prompt: always exits 0, silently.
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
  const prompt = input.prompt ?? "";
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

  if (!sessionId) process.exit(0); // nothing we can key the log by; stay silent

  const now = new Date();
  const nowIso = now.toISOString();

  const fpath = findOrCreateSessionLogFile(projectDir, sessionId, nowIso, now);
  const num = countEntries(fpath, "PROMPT") + 1;

  appendEntry(fpath, {
    type: "PROMPT",
    num,
    sessionId,
    timestamp: nowIso,
    body: prompt,
  });

  touchFrontmatter(fpath, { totalExchanges: num, lastPromptTime: nowIso });
} catch (err) {
  // Never let a capture-hook bug block the user's actual prompt.
  try {
    process.stderr.write(`capture-prompt hook error: ${err?.stack || err}\n`);
  } catch {}
}
process.exit(0);
