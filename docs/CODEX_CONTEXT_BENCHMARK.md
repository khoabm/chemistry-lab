# CP02 — Codex context-loading benchmark

Status: **PREPARED — NOT YET EXECUTED**. This document defines a controlled, read-only benchmark, not measured results or permission to change application code.

## Goal

Check whether the shorter repository instructions reduce unnecessary context/tool work **without losing approved product, architecture, chemistry or interaction constraints**. Do not claim token savings from file size alone.

## Locked comparison

| Variant | Commit | Instructions |
| --- | --- | --- |
| A — baseline | `e860963977bec297d10b1a9eda1e596071fe2ff0` | Pre-refactor root AGENTS |
| B — candidate | `6cde7280ada780ed46825f634a77bcd036bf56fc` | Reviewed root AGENTS and docs optimization |

The application implementation is identical at these revisions: only seven Markdown files differ. Always benchmark these **immutable commits**, not moving branch names; any later candidate needs its own benchmark revision and result. Historical numbered milestones are not a reason to switch checkout. The feature set includes merged thermometer observation, selective equipment/material removal, and Water Boiling V1.

Static observation only: root `AGENTS.md` is 18,758 characters at A and 7,140 characters at B (approximately 62% smaller). **This is not an actual Codex token-usage measurement.**

## Execution protocol

1. Use the **same machine**, Codex CLI version, model, reasoning effort, tool/MCP availability, global instructions and approval configuration for both revisions. Record any uncontrolled differences; if they change materially, label the pair non-comparable.
2. Start from two separate, clean detached worktrees with those commits. Do not reuse an existing long conversation or supply previous model responses. Keep the test prompts and evaluation criteria outside the tested worktrees during the run if possible.
3. For each task below, run a **fresh Codex session** once on A and once on B, using the *identical prompt*. Alternate which revision runs first across tasks to reduce ordering effects. Optionally repeat each pair for variance.
4. Enforce **read-only** execution: no source/doc writes, dependency installation, tests/builds, Git mutations, commits, push, PR, merge or deployment. This benchmark measures document discovery and understanding rather than implementation.
5. Save CLI JSONL events and the final answer **outside the repository**, together with exit status, duration, Codex version, model, reasoning setting and optional token-usage fields. Verify both working trees remain unchanged.
6. Evaluate answers with the rubric below. Do not show the rubric to Codex as part of each task's prompt. Do not count a task as successful just because the agent reports that it has read fewer files.

### PowerShell setup (run in the existing repository)

```powershell
git fetch origin main
git worktree add --detach ../chemistry-bench-base e860963977bec297d10b1a9eda1e596071fe2ff0
git worktree add --detach ../chemistry-bench-candidate 6cde7280ada780ed46825f634a77bcd036bf56fc
New-Item -ItemType Directory -Force ../chemistry-bench-results | Out-Null
codex --version
```

Example for one task: use the *same* literal `$prompt` in both worktrees (paste the appropriate prompt below into the here-string). Do not run inside the long-running Codex chat; use a new CLI execution for each test.

```powershell
$prompt = @'
PASTE THE IDENTICAL TASK PROMPT HERE
'@
Push-Location ../chemistry-bench-base
codex exec --json --sandbox read-only $prompt > ../chemistry-bench-results/A-task1.jsonl 2> ../chemistry-bench-results/A-task1.stderr.txt
$baselineExit = $LASTEXITCODE
Pop-Location

Push-Location ../chemistry-bench-candidate
codex exec --json --sandbox read-only $prompt > ../chemistry-bench-results/B-task1.jsonl 2> ../chemistry-bench-results/B-task1.stderr.txt
$candidateExit = $LASTEXITCODE
Pop-Location
```

To time runs, execute the above CLI invocation inside PowerShell `Measure-Command { ... }`; keep timing and exit status for each run. `codex exec --json` emits event logs suitable for inspecting tool actions and any reported usage fields (for example a completed-turn usage event); log structure can differ by version. Inspect rather than assuming exact field availability. Missing token-usage metrics must be reported as **unavailable**, never estimated as actual usage. The results must not include authentication keys or private paths/secrets.

## Fixed task prompts

### T1 — Small UI change impact analysis

> Tôi dự định làm tên hiển thị của Beaker và Test tube trên bàn thí nghiệm bớt nổi bật về thị giác. Không được thay đổi hit area, vị trí logic, hành vi drag/keyboard hoặc khả năng truy cập. Hãy phân tích các phần code/tài liệu liên quan, những ràng buộc cần giữ và kiểm thử phù hợp. Chỉ báo cáo, không sửa file hoặc chạy test/build.

### T2 — Connected-equipment removal

> Hãy phân tích hành vi hiện tại khi xóa Alcohol Lamp đang đỡ Beaker có Thermometer gắn vào. Thiết bị nào còn lại, quan hệ nào bị hủy, trạng thái Heating sẽ ra sao và trường hợp lỗi nào cần test? Nêu vị trí code và bằng chứng kiểm thử cần thiết. Chỉ báo cáo, không sửa file hoặc chạy test/build.

### T3 — Thermal and physical visualization contract

> Trong Water Boiling V1, vì sao có thể thấy nước H₂O đang sôi ở mốc mẫu 100°C trong khi Thermometer chưa hiển thị 100°C? Xác định các quy tắc đã được duyệt, luồng tính toán và tests bảo vệ hành vi này; phân biệt sôi vật lý với phản ứng hóa học. Chỉ báo cáo, không sửa file hoặc chạy test/build.

## Scoring rubric — for the evaluator, not the task agent

Correctness is a **hard gate**: a lower token count does not compensate for an incorrect answer. Use source references to verify the following:

| Task | Required correctness | Representative evidence sources |
| --- | --- | --- |
| T1 | Identify presentation/bench labels and scoped styling; preserve selection, hit targets, pointer/keyboard, responsive layout, accessibility and localization; no chemical logic change | `LabWorkspace.tsx`, `EquipmentVisual.tsx`, `global.css`, `docs/UI_UX.md`, relevant UI tests |
| T2 | Removing a supporting lamp must not delete its Beaker/Thermometer; surviving vessel is released to a valid free position, mount and heat are removed, thermometer attachment remains; reject unsafe/incomplete removal requests; preserve confirmation/focus | `src/store/removal.test.ts`, `labWorkspace.ts`, `mounting.ts`, `EquipmentRemovalControls.tsx`, `RemovalFlow.test.tsx` |
| T3 | Water's 100°C plateau is a nominal **sample** temperature; the separately evolved sensor lags at onset and approaches the plateau; powered mount/lift/cooling rules apply; boiling is physical, not R9, gas effect, ReactionResult or Replay; no claims of quantitative evaporation | `docs/CHEMISTRY.md`, `plans/feature-water-boiling.md` (contract sections), `src/simulation/thermal/model.ts`, `src/store/waterBoiling.ts`, `src/store/waterBoiling.test.ts`, `src/simulation/thermal/water.test.ts` |

A run **FAILS** correctness if it contradicts an approved invariant, treats historical plan statements as current runtime, recommends unsupported architecture/dependency changes, fabricates chemistry, or claims verification it did not perform. Source links are illustrative, not mandatory exhaustive reading lists.

## Recorded metrics

For each run record:

- `variant`, `task`, immutable `sha`, CLI `version`, model, reasoning effort, exit status, elapsed seconds
- `input_tokens`, `cached_input_tokens` (if reported), `output_tokens` (if reported); distinguish cached inputs and do not confuse model usage with document-only token cost
- Count of tool calls and **unique document files** read; list irrelevant full-document reads and repeated reads of unchanged sections when verifiable from logs
- Correctness verdict (PASS/FAIL), decisive evidence, unsupported claims, and risk/uncertainty

### Results (to fill after executing local Codex)

| Task | A correctness | B correctness | A input/output tokens | B input/output tokens | A/B document reads | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | NOT RUN | NOT RUN | — | — | — | |
| T2 | NOT RUN | NOT RUN | — | — | — | |
| T3 | NOT RUN | NOT RUN | — | — | — | |

## Observed local run — 2026-10-20

Evidence supplied by the user: six `*.answer.txt` files, `results.csv`, and `metadata.json` from Codex CLI 0.163.0. The JSONL tool traces were **not** included. Worktrees were clean according to the benchmark runner; individual agents sometimes saw Git `unsafe repository`, which did not invalidate the answers but limited their Git checks.

| Task | A correctness | B correctness | A input / cached / output | B input / cached / output | A / B observed tool calls | A / B seconds |
| --- | --- | --- | --- | --- | --- | --- |
| T1 UI labels | PASS | PASS | 567941 / 483200 / 5415 | 415344 / 359552 / 4733 | 13 / 14 | 166.54 / 131.55 |
| T2 Remove Lamp | PASS | PASS | 646049 / 575616 / 4631 | 262460 / 217088 / 3953 | 12 / 11 | 112.24 / 121.29 |
| T3 Water Boiling | PASS | PASS | 415070 / 355840 / 4097 | 412633 / 357504 / 4516 | 10 / 8 | 119.08 / 143.22 |
| **Total** | **3 PASS** | **3 PASS** | **1629060 / 1414656 / 14143** | **1090437 / 934144 / 13202** | **35 / 33** | **397.86 / 396.06** |

**Comparison:** candidate input tokens −33.1%; noncached input (input minus cached) 214404 → 156293 (−27.1%); output tokens −6.7%; observed tool calls 35 → 33; elapsed time approximately unchanged (−0.5%). Input totals include cached input and are **not** direct measures of Markdown-read volume or billed cost. The strong T2 reduction and negligible T3 reduction show task dependence. One run per task/variant cannot prove reproducibility.

**Independent answer-level review:** all six responses respected architecture and scoped behavior. T1 retained label hit areas, keyboard/pointer and EN/VI; both flagged a historic UI_UX pointer-interaction conflict. T2 retained Beaker/Thermometer/attachment while removing Lamp/mount/heat and highlighted missing test cases. T3 correctly distinguished 100°C sample boiling from lagging sensor readings and physical boiling from registered chemistry/Replay. No confirmed documentation-caused correctness regression.

**Evidence limitations:** no JSONL to verify unique documents/sections read or repeated file reads, no local shell reproduction of the runner, no cost accounting or repetition for variance. Thus the answer-level correctness gate **PASSES**, while a reproducible context-reading-efficiency claim remains **PRELIMINARY**; CP02 is not an unconditional measured-efficiency PASS.

## Decision

- **PASS:** B passes all correctness gates and shows a reproducible efficiency benefit or a justified non-regression; disclose any tasks with increased cost.
- **CHANGES REQUIRED:** B introduces a wrong/missing contract, repeated irrelevant reads, or another confirmed regression. Propose the smallest documentation-only repair, then rerun the failed pairs.
- **INCONCLUSIVE:** token metrics unavailable and trace evidence insufficient, materially different environments, or a single noisy pair. Gather more evidence; do not make up a percent improvement.

Do **not** advance to context-summarization or Skills purely because the benchmark document exists. Obtain independent Codex review of any CP02 follow-up changes. Keep this optimization branch open; do not merge without user authorization.
