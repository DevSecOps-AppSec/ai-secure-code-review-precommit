#!/usr/bin/env node
// AI Secure Review (pre-commit)
// Uses prompt.txt, only reviews changed hunks.
// Required env: OPENAI_API_KEY
// Optional env: PRECOMMIT_STRICT (1 = block commit on High-risk findings)

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";

// 🔑 Required
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// ⚙️ Hardcoded defaults
const OPENAI_BASE_URL = "https://api.openai.com/v1";
const MODEL = "gpt-4o-mini";
const MAX_LINES = 1200;

// 🚦 Configurable strictness
const STRICT = (process.env.PRECOMMIT_STRICT || "0") === "1";

// Risky extensions (hardcoded)
const RISKY_EXTS = "js,ts,tsx,jsx,py,go,rb,php,java,kt,cs,rs,swift,c,cc,cpp,h,sql,sh,ps1,yml,yaml,json,html,htm,css,scss,vue,mdx"
  .split(",").map(s => s.trim().toLowerCase());

function risky(file) {
  const ext = file.toLowerCase().split(".").pop();
  return RISKY_EXTS.includes(ext);
}

function readPromptTxt() {
  const p = path.join(process.cwd(), "prompt.txt");
  if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  return "You are a senior Application Security engineer. Perform a precise secure code review on the provided diffs.";
}

function collectStagedHunks() {
  const full = execSync("git diff --cached --unified=3 --diff-filter=ACMR", { encoding: "utf8" });
  const lines = full.split("\n");
  let include = false;
  let keep = [];
  for (const ln of lines) {
    if (ln.startsWith("diff --git ")) {
      const m = ln.match(/ a\/(.+?) b\/(.+)$/);
      const file = (m && (m[2] || m[1])) || "";
      include = risky(file);
    } else if (include && (ln.startsWith("@@") || ln.startsWith("+") || ln.startsWith("-"))) {
      keep.push(ln);
    }
  }
  if (keep.length > MAX_LINES) keep = keep.slice(0, MAX_LINES);
  return keep.join("\n");
}

async function main() {
  const diff = collectStagedHunks();
  if (!diff.trim()) {
    console.log("[pre-commit] No eligible staged changes — skipping AI review.");
    process.exit(0);
  }
  if (!OPENAI_API_KEY) {
    console.log("[pre-commit] OPENAI_API_KEY not set — skipping AI review.");
    process.exit(0);
  }

  const systemPrompt = readPromptTxt();
  const userMessage = `Unified diffs (staged, changed hunks only). Between markers.
>>> BEGIN_PATCHES
${diff}
<<< END_PATCHES`;

  try {
    const resp = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 800,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error(`[pre-commit] AI call failed: ${resp.status} ${t}`);
      process.exit(STRICT ? 1 : 0);
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    console.log("\n── AI Secure Review (pre-commit) ──\n");
    console.log(text);
    console.log("\n───────────────────────────────────\n");

    if (STRICT && /Risk Summary[\s\S]*High[^0-9]*([1-9]|[1-9][0-9])/i.test(text)) {
      console.error("❌ High-risk finding(s) reported. Commit blocked (PRECOMMIT_STRICT=1).");
      process.exit(1);
    }
    process.exit(0);
  } catch (e) {
    console.error("[pre-commit] ERROR:", e?.message || e);
    process.exit(STRICT ? 1 : 0);
  }
}

main();
