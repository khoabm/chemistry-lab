# Codex prompt protocol — Web Chemistry Lab

> **Read on demand** when ChatGPT prepares a Codex analysis,
> implementation, review or correction prompt. Start from
> [ChatGPT project brief](CHATGPT_PROJECT_BRIEF.md). This file describes
> the user-agreed collaboration interface; it does not authorize
> implementation, Git changes or milestone transitions.

## Workflow and ownership


For significant features: **ChatGPT explores/challenges → scope and acceptance
are explicitly agreed → approved Markdown source-of-truth is updated on a
feature branch → Codex inspects the actual repo and drafts an ExecPlan under
`.agent/PLANS.md` → review/approval → Codex implements/tests/browser-checks →
independent review and user-authorized Git integration.**

For narrow, low-risk fixes, a separate ExecPlan is not automatically required;
still define observable acceptance and appropriate tests. ChatGPT owns product
reasoning and independent review; **Codex owns implementation details after
inspecting code**. Do not give an invented file-by-file implementation map.

Use the **exact established opening** below for the corresponding Codex mode.
A prompt should be standalone, scoped and verifiable. This brief records the
opening phrases and field structure, **not** a claim that every historical
prompt had identical wording.

### A. Codex — Analysis (no code changes)

`Analyze the following requirement before implementation:`

Then give: **Context and current branch/feature scope; user-visible goal;
in-scope/non-goals; relevant approved contract paths; scientific/UX
constraints; questions/conflicts; expected acceptance evidence.**

Require Codex to inspect current Git/source and relevant documentation,
distinguish assumptions from facts, propose options/tradeoffs and stop.
**No source edits, tests/build unless explicitly requested, commit or merge.**

### B. Codex — Implementation (after approval)

`Implement the following feature within the current active milestone:`

Then give: **Approved feature/branch and milestone relationship; observable
requirements; non-goals; contract references; acceptance criteria; test and
browser-QA expectations; Git and reporting constraints.** “Current active
milestone” is the established prompt label: **do not infer it is M11**.
For an authorized auxiliary feature, explicitly name its actual branch/ExecPlan
and state that it does not advance the numbered milestone.

Codex must inspect source/stack first; create/update the living ExecPlan when
required; choose implementation details; run focused regressions and
risk-appropriate typecheck/lint/build/browser QA. Do not commit/push/merge or
advance milestone without explicit authorization.

### C. Codex — Review / correction / Git handoff

There is no mandatory historical exact opening for these modes. Identify
the mode explicitly:

- **Review:** supply target branch/HEAD/base and acceptance contracts; inspect
  actual diff, relevant tests and browser evidence; classify confirmed findings
  by severity with exact location, impact and minimal fix; return PASS or
  CHANGES REQUIRED; do not edit.
- **Correction:** supply confirmed finding and reproduction; change only the
  necessary scope, add regression tests, revalidate affected behavior and
  report remaining risks; no unrelated refactor.
- **Commit/push/merge:** separate explicit user authorization. Never interpret
  implementation completion, review PASS or green CI as automatic permission.

**Response format for Codex handoffs:** lead with **mode and task**, then
**approved scope / out of scope**, **observable acceptance**, **sources to
inspect**, **tests/browser evidence**, **Git constraints**, and **required
report** (revision, changed files, checks actually run, findings/limitations).
For ChatGPT reviews, begin with the verdict and highest-severity finding, not
praise or speculative improvements.

