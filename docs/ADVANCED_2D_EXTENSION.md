# Advanced 2D Phenomena — Extension scope and decision gates

**Status:** broader M13 development direction approved on 2026-10-22; this document authorizes **feasibility and a Codex-authored ExecPlan**, not unconditional implementation of every candidate.
**Branch:** `M13-advanced-2d-extension`, forked from the reviewed R9 branch `M13` at `7648bf1b8afab812a11baaf1dee9fc46a42780bf`; `main` has not received R9.
**Next deliverable:** `plans/m13-advanced-2d-extension.md` authored by Codex per `.agent/PLANS.md`, then independent ExecPlan review and explicit implementation-scope approval.
**Relationship to prior work:** `docs/ADVANCED_2D_PHENOMENA.md` and `plans/m13-advanced-2d-phenomena.md` document the completed R9 implementation and its QA. Preserve those recorded decisions/evidence; do not reopen R9 without a confirmed regression.

## Product goal

M13 should expand the laboratory's **meaningful 2D phenomenon vocabulary**, not merely increase reaction count. Demonstrations serve lower-secondary learners: the visible scientific event must be recognizable at bench scale, plausible in its physical context, prompt, and finite where appropriate. A result's observable story should distinguish the initial material, onset, development, endpoint and any persistent residue or material appearance.

Priority: scientific correctness → observable plausibility → visual clarity → decorative polish. Maintain the currently established React/TypeScript/SVG/CSS architecture, `useReducer` ownership, registered deterministic chemistry, explicit Mix/Heat controls, current thermal clock and finite Reaction Dynamics/Teaching Replay. Educational time compression does not imply measured kinetics. A 3D mode, if developed later, will complement rather than replace 2D.

## Already delivered — retain and protect

- R1–R4: precipitation forms and settles; persistent deposit.
- R5: finite gas from liquid mixture.
- R6: restrained warmth, no invented gas/precipitate/color.
- R7: heated-solid transformation with low solid-origin gas.
- R8: hydrated copper sulfate solid turning pale/white, **without** new vapor/gas effects under its approved baseline.
- Pure-water boiling: physical 100°C teaching plateau and separate visual, not a registered chemical reaction or Replay.
- R9: Zn + CuSO4 copper surface deposition on visible zinc, paler-blue solution, 6000ms illustration, finite shared lifecycle and Replay; QA accepted on base branch.

Do not restart an already completed effect, perform general 2D polish, change material inventory into product/consumption accounting, or merge/release `M13` implicitly.

## B — First priority: metal–acid phenomenon (R10 candidate)

**Candidate, not yet registered:**

```text
Zn(s) + 2 HCl(aq) → ZnCl2(aq) + H2(g)
```

Zinc and hydrochloric acid already exist in the catalog; no new selectable material is presumed necessary. The teaching value must come from a **distinct, scientifically contextualized visual**, not just a second gas rule:

1. Small hydrogen bubbles originate at the **submerged zinc–solution interface**, detach, rise through liquid and cease when the finite illustrative sequence completes. Do not depict boiling, gas from a heated dry solid, arbitrary bubbling across an entire liquid, smoke, or ignition.
2. Assess whether a restrained **surface/material alteration** of the gray zinc substrate improves clarity without claiming measured zinc consumption, reaction completion percentage or loss of a definite mass. This alteration is **conditional** on chemistry/visual feasibility; do not force it if it misleads or is unreadable.
3. Give a distinct explanatory observation: gas is hydrogen, not CO2; no invented precipitate, blue solution transition or copper coating. Compare intensity qualitatively to the existing R5 and R7 visual contracts rather than asserting numerical rates without concentration/amount inputs.
4. Preserve the **explicit Mix** educational trigger. Explain that real contact can initiate reaction without manual stirring; do not implement automatic collision/contact chemistry. The interface is a visual origin, not a new trigger.
5. Do not model actual acid concentration, zinc depletion, gas yield, pressure, real-time kinetics, heat budget or calibrated thermometer response. Keep unsupported numerical measurement honest.
6. Hydrogen is flammable. The UI should not show ignition, a flame test or an alcohol-lamp interaction as part of this demonstration; consider a concise non-operational educational safety note if it improves understanding.
7. Reuse the visible gray zinc material paths from R9 where possible. Geometry must keep bubbles attached to their source and clipped correctly inside Beaker/Test tube while preserving R9 visual behavior.

**Mandatory design questions before coding:** whether the existing semantic `gas` effect can be extended with a new source/context without regressing R5/R7; whether the alteration needs its own effect type; what happens with repeated Mix, removal/invalidation, Dropper-prepared acid, attached thermometer, mounted lamp and concurrent R9/R10; which existing specifications require deliberate extension; and what exact browser observations prove a genuinely distinct effect. Compare at least one minimal alternative (e.g., localized gas alone without visually eroding zinc).

**Gate B1 — feasibility/ExecPlan review:** Codex documents the smallest scientific/rendering model, reaction rule and testable acceptance; review identifies unresolved assumptions. **Gate B2 — user approval:** only after review explicitly approve R10 and any optional substrate alteration. **Gate B3 — implementation:** update approved source-of-truth contracts first, then implement/test/browser-QA on an authorized branch.

## C — Secondary candidates: evaluate independently, do not auto-implement

### C1. Physical dissolution

Potential educational reference: blue `copper-sulfate-pentahydrate` crystals added to pure water; crystals diminish as the liquid becomes blue. **This is a physical dissolution presentation, not a new registered chemical reaction** and must not be labeled R11 merely to fit the `mix` engine.

Feasibility must examine how to represent a physical process alongside existing separate water-boiling ownership and the exact-set chemistry/no-reaction semantics. Do not introduce a generic phase-change engine, hidden second progress clock, inferred solubility/concentration/saturation, product inventory, arbitrary automatic triggers, or an undisclosed contradiction with existing water/thermal behavior. Compare a minimal bounded presentation with deferring it entirely. Provide a separate scientific/product decision gate before implementation.

### C2. R8 water condensation under heating

Heating `CuSO4·5H2O` can release water. A limited condensation cue might be scientifically educational **only if** the actual apparatus and rendering context support it. The present R8 contract deliberately forbids a new M9 vapor effect, so **do not add steam/gas/condensation before separate approval**.

Evaluate whether droplets could plausibly appear on a cooler part of the existing Test tube and remain legible, without inventing a delivery tube, collecting vessel, visible smoke cloud, boiling liquid, measurable water yield or new heat-transfer mechanics. The RSC's example that collects condensed water uses a receiving tube and delivery tube; that apparatus must **not** be silently attributed to the application's existing single-tube setup. If the depiction is scientifically ambiguous, prefer to keep R8 unchanged.

C1 and C2 must have independent conclusions: **implement / defer / reject**, with evidence, cost and effect on existing contracts. User approval of the broad M13 roadmap is **not** approval to change the physical engine or R8's baseline contract.

## D — M13 final 2D acceptance

After approved extensions, assess *phenomenon coverage*, not number of registered rules. Confirm clear distinctions among precipitation, liquid-origin gas, heated-solid gas, submerged-surface gas (if B approved), warming, solid transformations, surface deposition, solution-color transitions, physical boiling, and any separately approved dissolution/condensation.

Acceptance framework:

- Correct reactants/triggers; exact-set/no-reaction semantics, unrelated R1–R9 and approved R10 unaffected.
- Initial → developing → finite endpoint → persistent residual appearance; no indefinite chemistry effects or stale replay. Separate continuous water boiling.
- True bench-scale readability in Beaker/Test tube; close-up/Enlarged View; desktop 1440×960, portrait 390×844, short landscape 844×390, EN/VI fallback.
- Manual Replay and at least two Auto cycles; source/recording identity; overlay hit testing; keyboard/pointer and cancellation; `prefers-reduced-motion: reduce` verified in actual Chromium, not just stylesheet source.
- Full relevant tests/typecheck/lint/build plus browser evidence; multiple effects simultaneously and bounded DOM/animations. Report actual FPS/device instrumentation separately, never fabricate it.
- No false numeric sample-temperature claim or new thermal reaction where unsupported; preserve R6 finite heat, R7/R8 teaching caps, thermometer lag, Dropper, equipment/material removal and water boiling.
- Explicitly list unverified physical-device or screen-reader claims; do not turn them into PASS.

No lesson/course management, localization sign-off before teacher review, full stoichiometry, physics/particle engine, 3D replacement, video integration, generic smoke/splash/flame or unrelated refactor is included.

## Workflow, document ownership and approval

1. **Preparation (now):** preserve R9 base, create a dedicated branch and source-of-truth extension brief, link from the milestone index. No application implementation.
2. **Codex feasibility/ExecPlan:** inspect local checkout and actual source; author `plans/m13-advanced-2d-extension.md` using every section in `.agent/PLANS.md`. Include a concrete B implementation proposal, an explicit optional zinc-alteration decision, independent C1/C2 trade-offs, schedule/checkpoints, tests, visualization evidence and stop conditions. Never silently mark candidate chemistry as approved.
3. **Independent review / user scope gate:** review the ExecPlan first. Authorize concrete B implementation; decide C1 and C2 individually after feasibility. Record approvals in current documents before corresponding code.
4. **Scoped implementation/QA:** Codex follows approved plan, updates living Progress/Decision log, commits to authorized branch, runs focused then full integration/browser checks. Avoid resetting or rewriting accepted R9 history.
5. **Final acceptance/merge:** independent review and explicit merge approval. Do not automatically merge into `M13` or `main`, declare numbered M13 complete, deploy or advance to M14/M15.

## Scientific references to verify while designing

- RSC, *Microscale reactions of metals with acids*: https://edu.rsc.org/experiments/microscale-reactions-of-metals-with-acids/509.article (zinc/acid produces hydrogen, less vigorous than magnesium under described experiment conditions).
- RSC, *What happens when something dissolves*: https://edu.rsc.org/download?ac=543471 (copper sulfate crystals diminish while solution becomes blue).
- RSC, *A reversible reaction of hydrated copper(II) sulfate*: https://edu.rsc.org/experiments/a-reversible-reaction-of-hydrated-copperii-sulfate/437.article (water removal and condensation using a **specific apparatus**, not necessarily the present single tube).

References support **qualitative phenomena** only; they do not supply the application's animation timings, rates, masses, relative bubble counts, ideal palette or student-safety certification.
