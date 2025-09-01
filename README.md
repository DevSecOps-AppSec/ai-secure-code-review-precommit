# AI Secure Code Review Pre-commit Hook

Runs an **AI-based secure code review** on **staged changes (changed hunks only)** during `git commit`.  
Uses the same `prompt.txt` as your GitHub Action, so PR reviews and local reviews stay consistent.

## Install

1. Add this repo to your project’s `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/DevSecOps-AppSec/ai-secure-code-review-precommit
    rev: v1.0.0
    hooks:
      - id: ai-secure-review-staged
