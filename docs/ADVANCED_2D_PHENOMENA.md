# Advanced 2D Phenomena — Scope and feasibility specification

**Status:** design/scoping authorized; implementation scope **not yet approved**.
**Roadmap reference:** Advanced 2D Phenomena (called M13 in the original roadmap).
**Working branch:** `M13` based on `main` at `aa7b8f8cc10d8c1247b1799ac6011207eaed1abc`.
**Next owner:** Codex inspects the actual checkout and authors a living ExecPlan under `plans/` according to `.agent/PLANS.md`. This document is the product/design input, **not** an ExecPlan or implementation approval.

## Purpose and constraints

Extend the range of **scientifically meaningful 2D phenomena**, rather than repeating visual polish for already working reactions. This is a browser-only, visualization-first teaching demonstration: fast, legible qualitative development is more important than numerical fidelity or real reaction kinetics. A new visual must portray the correct kind and physical location of the phenomenon, not merely look dramatic.

Preserve the existing direct bench interaction, explicit `Mix` and mounted/lit `heat` triggers, reaction-result ownership, finite development/final hold, Teaching Replay, responsive layout, accessible controls and reduced-motion behavior. Prefer the existing SVG/CSS system; do not add a physics/particle engine or new dependencies without a separately demonstrated need and approval.

The authoritative *implemented* chemistry remains R1–R8 in `docs/CHEMISTRY.md` and `src/simulation/reactions/`; pure-water boiling remains a **physical** phenomenon, not another registered reaction. The accepted baseline audit reported no confirmed blocker in R1–R8/Water Boiling V1, but live R7/R8 transients, direct reduced-motion browser behavior, physical-device performance and many concurrent effects were not exhaustively verified. Do not reinterpret these unverified checks as passed.

## Planning objective

Codex must inspect the current implementation and compare a **minimal new 2D phenomenon** against plausible alternatives. Deliver a design that adds clearly recognizable chemistry-visual behavior, is reusable where appropriate, and does not over-expand application-state or the rendering architecture. If the candidate has disproportionate complexity or scientific risk, document an alternative and ask for a scope decision rather than implementing it.

### First candidate for evaluation — metal displacement

Qualitative reference example (a **proposal**, not an approved reaction registration):

```text
Zn(s) + CuSO4(aq) → ZnSO4(aq) + Cu(s)
```

Potentially valuable new visual vocabulary:

1. **Solution color transition:** the blue copper(II) sulfate solution becomes less blue during the illustrative reaction. Do not promise complete disappearance of blue in arbitrary qualitative portions or make concentration/extent claims.
2. **Surface deposition:** reddish-brown copper appears on zinc at a **solid–liquid interface**; it must not be rendered as generic precipitate falling from the liquid to a bed at the bottom.

Feasibility questions that **must be resolved in the ExecPlan**:
- Can the current qualitative solid drawing anchor a surface-localized effect without introducing unbounded per-particle state or new physical simulation?
- Does the visual treatment remain legible in both Beaker and Test tube, small bench SVG, enlarged view, and Replay?
- How should the proposed material/reaction definitions integrate with **exact reactant-set matching** and explicit `Mix`, given that immersion may begin a real displacement reaction without manual stirring? Any educational abstraction must be explicit.
- Can semantic `ReactionEffect` data describe both new visuals while the renderer owns CSS/SVG detail and temporal progression?
- How should the final illustrated appearance coexist with the existing **starting-substances-only** container inventory, without pretending to model post-reaction composition, conversion, yield, or the reuse of products?
- Is there a more suitable reaction or phenomenon with comparable teaching value and lower complexity? Compare at least one option; do not add multiple reactions by default.

No new chemical, reaction ID (`R9` included), product, effect type, threshold or trigger is **approved merely by appearing in this candidate section**. Approval of a specific chemistry rule and source-of-truth updates must precede implementation.

## Scope of the current design task

- Review the existing reaction definitions/engine, semantic effect types, contents renderer, shared reaction visualization, animation lifecycle and Replay.
- Evaluate the above candidate and at least one alternative on scientific clarity, source/state compatibility, reusability, accessibility and implementation cost.
- Choose a smallest defensible technical proposal, with concrete affected files, ownership/data-flow impacts and product decisions requiring approval.
- Define **observable** success criteria and a bounded regression/browser validation strategy for a possible implementation.
- Create a new living ExecPlan in `plans/m13-advanced-2d-phenomena.md` following every required section of `.agent/PLANS.md`, with `Progress` showing planning only. Codex may refine the recommended scope in that ExecPlan but must identify any conflicts with this document instead of silently changing the product contract.
- Return the ExecPlan and trade-offs for independent review. **Stop before application/source implementation**.

## Potential implementation acceptance checks (conditional, not yet authorization)

If a new phenomenon is approved later, require at minimum:

- Registered rule matches **only** its supported chemicals and the appropriate existing trigger; order-independent, exact-set/no-reaction behavior and R1–R8 remain unchanged.
- The new visual shows a discernible onset, meaningful progression, bounded transient activity and persistent final outcome; it does not imply unmodeled chemistry.
- Solution appearance and solid-surface product remain distinguishable at workspace scale and in enlarged view; no unrelated gas, precipitate, steam, warmth or reaction triggers are invented.
- A single occurrence drives live visualization and Replay; opening/resizing/changing locale does not retrigger chemistry or restart effects. Existing animation and thermal clocks remain authoritative.
- Reduced-motion has an informative non-moving appearance. Keyboard/pointer selection and interaction hit targets are not obscured by noninteractive effect layers.
- Add/update unit tests for new chemistry and any simulation/domain behavior; add renderer/component/integration regression tests for lifecycle/view behavior. Verify relevant edge cases including invalid mixtures, Reset/Empty/remove, multiple simultaneous reactions and no accidental product reuse.
- Run focused tests during development and full appropriate typecheck, lint, suite and production build at integration/final acceptance; perform browser QA for desktop, portrait, short landscape, Replay and `prefers-reduced-motion`. Profile multiple simultaneous effects or disclose limitations, rather than claiming low-end-device FPS without evidence.

## Non-goals

- Reworking R1–R8, finite gas/precipitate animation, Replay or Water Boiling V1 absent a confirmed blocker/regression.
- 3D rendering, real video, fluid/particle physics, collision/spilling, automatic reaction triggers, general chemistry inference.
- Chemical consumption, post-reaction composition, limiting reagents, quantitative concentration, stoichiometry, real kinetics, reaction chaining or calibrated thermodynamics.
- Lessons, guided exercises, scores/accounts/backend, or completing Vietnamese chemistry terminology before teacher/SGK review.
- Changing existing mounted heating, thermometer and Dropper semantics.

## Source-of-truth and authorization gates

1. **Completed now:** create a dedicated planning branch and approved design brief without touching runtime code.
2. **Codex planning:** inspect current checkout; write/update the ExecPlan in `plans/` and report feasibility, assumptions, risks, alternative and draft acceptance. No code edits in this gate.
3. **User scope approval:** reviewer and user choose the actual reaction/phenomena and the implementation boundary. Only then update the relevant living chemistry, UI/UX and milestone specifications as needed; preserve historical records.
4. **Implementation and QA:** Codex implements the authorized plan with tests/browser evidence, keeping the living ExecPlan synchronized.
5. **Independent review and explicit merge approval:** do not automatically advance the recorded numbered milestone, merge, deploy or broaden the scope.

Reference documents: `AGENTS.md`, `.agent/PLANS.md`, `docs/PRODUCT.md`, `docs/MILESTONES.md`, `docs/CHEMISTRY.md`, `docs/REACTION_DYNAMICS.md`, `docs/UI_UX.md`, `docs/ARCHITECTURE.md`, and `src/simulation/AGENTS.md`.
