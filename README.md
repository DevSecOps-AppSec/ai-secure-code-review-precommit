# 🔐 AI Secure Code Review Pre-commit Hook

Runs an **AI-based secure code review** on **staged changes (changed hunks only)** during `git commit`.  
It uses the same `prompt.txt` as your GitHub Action, so local and PR reviews stay **consistent**.

---

## ✨ Features

- Reviews **only staged hunks** (not whole files).
- Uses **secure prompt instructions** (copied from the GitHub Action).
- Summarizes **High/Medium/Low risks** with clear remediation.
- **Warn-only by default** (commits go through even with findings).
- **Strict mode** available → block commits if high-risk issues are detected.
- Easy to configure with environment variables.

---

## 🚀 Installation

1. Add this repo to your project’s `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/DevSecOps-AppSec/ai-secure-code-review-precommit
    rev: v1.0.0
    hooks:
      - id: ai-secure-review-staged
```

2. Install [pre-commit](https://pre-commit.com):

```bash
pip install pre-commit
pre-commit install
```

Now, the hook will run automatically on each commit.

---

## 🔑 Model Credentials & Configuration

Before committing, set the required environment variables:

```bash
# Required: your API key
export OPENAI_API_KEY="sk-..."

# Optional overrides
export OPENAI_BASE_URL="https://api.openai.com/v1"   # Default: OpenAI API
export MODEL="gpt-4o-mini"                           # Default: gpt-4o-mini
export MAX_LINES=1200                                # Max staged lines to send
export PRECOMMIT_STRICT=1                            # Block commit on High-risk findings (default: warn only)
```

👉 To persist, add them to `~/.bashrc`, `~/.zshrc`, or your shell profile.

---

## ⚙️ Behavior

- Collects **unified diffs of staged files** with risky extensions (`.js, .py, .go, .java`, etc.).
- Sends trimmed hunks to the model with **secure prompt instructions** (`prompt.txt`).
- Prints review results inline before commit finishes.
- In **default mode** → warnings are shown but commit proceeds.
- With `PRECOMMIT_STRICT=1` → commit is **blocked** if AI flags **High-risk issues**.

---

## 📂 File Structure

```
ai-secure-code-review-precommit/
├─ .pre-commit-hooks.yaml   # hook manifest
├─ scripts/
│  └─ ai_precommit_review.js  # Node.js script for staged diff review
├─ prompt.txt               # Secure review prompt (same as Action)
├─ README.md
└─ LICENSE
```

---

## 🛠️ Example Workflow

```bash
# Stage a risky file
git add app.js

# Try to commit
git commit -m "Add new feature"

# Output:
# ── AI Secure Review (pre-commit) ──
# Risk Summary: High:1, Medium:2, Low:0
# 1. [Finding] Possible SQL Injection...
#    Why it matters...
#    Evidence: + db.query("SELECT * FROM " + userInput)
#    Fix: Use parameterized queries.
#
# Safeguards Checklist:
# - [x] Input validation
# - [ ] SQL injection prevention
#
# ❌ Commit blocked (if PRECOMMIT_STRICT=1)
```

---

## 🧰 Troubleshooting

- **`[pre-commit] OPENAI_API_KEY not set — skipping AI review.`**  
  → Make sure you exported your key (`export OPENAI_API_KEY=...`).

- **API quota exceeded / 429**  
  → Upgrade your API plan or use another base URL (`OPENAI_BASE_URL`).

- **Timeout**  
  → Reduce `MAX_LINES` or set `TIMEOUT` (default ~40s).

---

## ❌ Uninstall

```bash
pre-commit uninstall
```

---

## 📜 License

MIT
