# ChatGPT project brief — Web Chemistry Lab

> **Audience:** a fresh ChatGPT chat doing product planning, milestone design,
> independent review or Codex handoff. **Read this page first**, then open only
> the sources relevant to the question. This is a navigation/collaboration guide,
> **not** a replacement for the approved specifications or the checked-out code.
> Baseline checked: 2026-10-21 (`main` at `aa7b8f8cc10d`); verify Git and current
> documents for every status-sensitive decision.

## 1. Project in 60 seconds

- **Product:** a browser-based, frontend-only virtual chemistry lab for lower
  secondary-school (THCS) teaching and exploration. The learner freely places
  equipment, adds chemicals, explicitly Mixes or Heats, observes understandable
  phenomena and can experiment again. “No observable reaction” is a valid outcome.
- **Priority:** believable, pedagogically meaningful **2D visualization and fast
  feedback**, not exhaustive quantitative chemistry or long physical wait times.
  A possible parallel 3D direction is future exploration, not a current mandate.
- **Scientific boundary:** correct *qualitative meaning* matters even when time,
  heat and presentation are simplified. Only registered R1–R8 use `mix`/`heat`
  chemistry triggers. Pure-water boiling is a distinct physical phenomenon, not R9.
  No invented reactions, stoichiometry, kinetics, precise SI quantities or results.
- **Implementation:** React + TypeScript + Vite, React `useReducer` workspace,
  pure simulation helpers, SVG/CSS, Vitest/RTL, EN/VI via i18next. Respect
  Presentation → Application state → Simulation → Domain separation.
- **Teaching direction:** improve existing reaction phenomena and observation
  before adding scope. Detailed lesson/guided mode, chaining, quantitative models,
  and broader 3D work are **not approved by this brief**. Vietnamese chemistry
  terminology can require teacher/product review; do not claim certification.

## 2. Milestone and roadmap status — never guess

- `docs/MILESTONES.md` currently records **M11** as the **latest explicitly
  recorded numbered milestone**. That is a roadmap label, **not** proof that M11
  is the current Git branch or the next feature to implement.
- Thermometer B+, equipment/material removal and Water Boiling V1 have already
  been integrated into `main`. Read `README.md` for implemented overview and
  inspect Git/approved feature ExecPlans for exact revision and constraints.
- Later milestone ideas (including advanced 2D phenomena) discussed in chats are
  **proposals until their scope is explicitly approved and synchronized to the
  repository**. Do not announce M12/M13 or another milestone as active merely
  from a discussion, a historical plan or an assumed sequence.
- The long-term direction is visualization-first and chemistry-faithful at the
  qualitative level. Prioritize reviewing current R1–R8 visual behavior before
  expanding reaction catalogs. Do not turn this direction into automatic scope.

## 3. Two ChatGPT working modes — shared rules, distinct decisions

**Planning mode** (the conversation “Phát triển milestone”): challenge
requirements and tradeoffs; clarify user-visible goal, scope/non-goals,
scientific/visual constraints, dependencies, acceptance and risks. Separate
**approved / proposed / deferred / unknown**. Propose a roadmap step only;
do not advance milestones or prescribe unverified implementation file maps.

**Independent review mode** (the conversation “Hỗ trợ định hướng web đã phát
triển”): inspect the actual branch/diff, code, tests and applicable contracts.
Report only confirmed defects, severity (P0–P3 when relevant), evidence, user
impact and minimum viable corrections. Distinguish bugs from optional UX polish
or future roadmap suggestions; a green CI is not proof of visual correctness.
Do not convert a review into unsolicited milestone planning or broad refactoring.

**Both modes:** answer in concise, candid Vietnamese; disagree when supported
by evidence. Distinguish *implemented*, *tested*, *browser-verified*,
*scientifically accepted* and *merged*. State missing evidence rather than
inventing results. Do not silently upgrade chat proposals into formal contracts.

## 4. Authority and selective reading

| Question | Open first |
| --- | --- |
| Vision, audience, non-goals | `docs/PRODUCT.md`; this brief's `1 |
| Latest **recorded** milestone, roadmap history | `docs/MILESTONES.md`; verify current Git and user approval |
| Architecture/state ownership | `docs/ARCHITECTURE.md`, `AGENTS.md`; affected code only if implementing/reviewing |
| Registered chemistry/thermal assumptions | `docs/CHEMISTRY.md`; `src/simulation/AGENTS.md` when relevant |
| Visual effects, compressed timing, Replay | `docs/REACTION_DYNAMICS.md` |
| UI, drag, mounted equipment, responsive, a11y | `docs/UI_UX.md` |
| EN/VI, teacher-reviewed terminology | `docs/LOCALIZATION.md` |
| Approved feature scope and execution gates | The **relevant** `plans/*.md` and `.agent/PLANS.md` |
| Current shipped behavior / scripts | `README.md`, Git revision, relevant source/tests |

**Decision hierarchy:** the user explicitly approves new scope; approved
specifications state intended behavior; Git and inspected source/tests show
what is actually implemented; plans record authorized feature scope and dated
decisions. When these disagree, identify the conflict and request a decision
rather than treating historical log entries as the current contract.

A new ChatGPT chat **does not automatically have the complete transcripts**
of the two named conversations, nor live repository access just because this
file exists. If an earlier decision is not in accessible context or the repo,
label it unverified and ask for the needed excerpt. Read selected headings,
not complete source trees or thousand-line ExecPlans by default.

## 5. Agreed workflow and Codex prompt protocol

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

## 6. Use from a brand-new ChatGPT conversation

**Preferred:** inside the ChatGPT Project “Web chemistry lab”, make this
document available as project context or give the chat repository access,
and set the short project instruction below. An uploaded snapshot needs
refreshing when this file changes; GitHub content requires enabled live
repository access. Nothing in the repo forces a new chat to read it.

**Minimal opening message if no Project context is available:**

> We are working on `khoabm/chemistry-lab`. Please read
> `docs/CHATGPT_PROJECT_BRIEF.md` on the appropriate Git revision first.
> Act in **planning** or **independent review** mode according to my task.
> Do not read the entire source tree. Verify milestone and branch status
> before claims, preserve approved contracts, and follow the established
> Codex prompt format. If you cannot access that file, tell me and ask
> for this one brief rather than guessing.

**Suggested ChatGPT Project instruction (short; it only routes to this file):**

> For Web Chemistry Lab, consult `docs/CHATGPT_PROJECT_BRIEF.md` before
> milestone planning, independent code review or composing Codex prompts.
> Use only task-relevant approved specifications and actual Git evidence.
> Separate approved/proposed/history and implementation/test/acceptance.
> Preserve the existing Codex prompt openings. Be concise, candid and
> specific in Vietnamese. Never invent an approval, result or roadmap step.

## 7. Maintenance

Keep this page short and **navigation-focused**. Update it only when approved
product direction, latest recorded milestone, division of responsibility or
Codex handoff protocol materially changes; include the date when recording a
snapshot. Do not copy full scientific tables, roadmap histories or code into
this brief. The linked specifications, feature plans and source remain the
authoritative details.
