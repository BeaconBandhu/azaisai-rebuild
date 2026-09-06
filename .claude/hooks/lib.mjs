// Shared helpers for the 8x-assignment capture hooks.
//
// Known limitation (documented in CAPTURE-TEST.md): neither UserPromptSubmit
// nor Stop hook input includes a `model` field (only SessionStart sometimes
// does, per https://code.claude.com/docs/en/hooks). We record the model as a
// constant reflecting what this engagement actually uses; if you switch
// models mid-session, entries will keep the old label until you update it here.
export const MODEL_NAME = "claude-sonnet-5";
export const TOOL_NAME = "claude-code";
export const PROJECT_NAME = "azaisai-rebuild";
export const AUTHOR = "BeaconBandhu";

import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export function readStdinJson() {
  const raw = readFileSync(0, "utf8");
  return JSON.parse(raw);
}

export function pad(n) {
  return String(n).padStart(2, "0");
}

// Format a Date as the filename timestamp: YYYY-MM-DD_HH-MM-SS (UTC).
export function fileTimestamp(d) {
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `_${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}`
  );
}

export function logsDir(projectDir) {
  return path.join(projectDir, ".agent-logs");
}

// Find this session's existing log file, if one exists.
export function findSessionLogFile(projectDir, sessionId) {
  const dir = logsDir(projectDir);
  if (!existsSync(dir)) return null;
  const suffix = `_${sessionId}.md`;
  const match = readdirSync(dir).find((f) => f.endsWith(suffix));
  return match ? path.join(dir, match) : null;
}

// Create a new session log file with frontmatter + header, return its path.
export function createSessionLogFile(projectDir, sessionId, nowIso, nowDate) {
  const dir = logsDir(projectDir);
  mkdirSync(dir, { recursive: true });
  const fname = `${fileTimestamp(nowDate)}_${sessionId}.md`;
  const fpath = path.join(dir, fname);
  const dateStr = nowDate.toISOString().slice(0, 10);
  const frontmatter =
    `---\n` +
    `session_id: ${sessionId}\n` +
    `date: ${dateStr}\n` +
    `author: ${AUTHOR}\n` +
    `model: ${MODEL_NAME}\n` +
    `tool: ${TOOL_NAME}\n` +
    `project: ${PROJECT_NAME}\n` +
    `total_exchanges: 0\n` +
    `first_prompt_time: ${nowIso}\n` +
    `last_prompt_time: ${nowIso}\n` +
    `---\n\n` +
    `# Session Log - ${dateStr}\n\n` +
    `Session: \`${sessionId.slice(0, 8)}\` | Project: \`${PROJECT_NAME}\` | Author: \`${AUTHOR}\`\n\n` +
    `---\n`;
  writeFileSync(fpath, frontmatter, "utf8");
  return fpath;
}

export function findOrCreateSessionLogFile(projectDir, sessionId, nowIso, nowDate) {
  const existing = findSessionLogFile(projectDir, sessionId);
  if (existing) return existing;
  return createSessionLogFile(projectDir, sessionId, nowIso, nowDate);
}

// Count existing entries of a given type ("PROMPT" or "RESPONSE") in the file.
export function countEntries(fpath, type) {
  const content = readFileSync(fpath, "utf8");
  const re = new RegExp(`\\[LOG_ENTRY type=${type}\\b`, "g");
  const matches = content.match(re);
  return matches ? matches.length : 0;
}

export function appendEntry(fpath, { type, num, sessionId, timestamp, body }) {
  const block =
    `\n[LOG_ENTRY type=${type} num=${num} session=${sessionId}]\n` +
    `timestamp: ${timestamp}\n` +
    `model: ${MODEL_NAME}\n\n` +
    `${body}\n`;
  appendFileSync(fpath, block, "utf8");
}

// Update the `total_exchanges` and `last_prompt_time` fields in the frontmatter.
export function touchFrontmatter(fpath, { totalExchanges, lastPromptTime }) {
  let content = readFileSync(fpath, "utf8");
  if (totalExchanges !== undefined) {
    content = content.replace(/^total_exchanges: .*$/m, `total_exchanges: ${totalExchanges}`);
  }
  if (lastPromptTime !== undefined) {
    content = content.replace(/^last_prompt_time: .*$/m, `last_prompt_time: ${lastPromptTime}`);
  }
  writeFileSync(fpath, content, "utf8");
}
