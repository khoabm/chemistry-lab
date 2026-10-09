# Web Chemistry Lab — Product Specification

## 1. Product vision

Web Chemistry Lab is a browser-based virtual chemistry laboratory designed
for introductory teaching and interactive demonstrations.

The user should feel that they are interacting with a small laboratory rather
than filling out forms or selecting reactions from a menu.

The application favors:

- exploration
- visual understanding
- simple direct interaction
- predictable educational behavior

over full scientific simulation.

---

## 2. Primary users

Primary users:

- students learning introductory chemistry
- teachers demonstrating basic chemical reactions

The application should be understandable without extensive onboarding.

---

## 3. MVP experience

The MVP contains one virtual laboratory workspace.

The user can:

1. choose laboratory equipment
2. place or move equipment on the workspace
3. choose a chemical
4. add the chemical to a compatible container
5. add additional chemicals when desired
6. mix container contents
7. optionally heat supported containers
8. observe predefined reactions
9. read a short educational observation
10. reset the laboratory and experiment again

Experimentation is intentionally free-form.

The user is not required to follow a predefined lesson.

---

## 4. Core product loop

The primary loop is:

Choose equipment
→ Add chemicals
→ Mix or heat
→ Observe result
→ Understand what happened
→ Try another combination

Trying combinations that do not react is considered valid exploration.

---

## 5. MVP interactions

The MVP supports two chemistry-related triggers:

### Mix

A reaction may occur when the contents of a container are mixed.

### Heat

A reaction may occur when a supported container is heated by an active
alcohol lamp.

No additional chemistry triggers are part of MVP.

---

## 6. MVP equipment

Initial equipment:

- beaker
- test tube
- dropper
- alcohol lamp

Equipment may be expanded in later versions.

The MVP should not attempt to reproduce a complete laboratory inventory.

---

## 7. MVP chemicals

The initial chemistry catalog should remain intentionally small.

The planned initial catalog is:

- silver nitrate — AgNO3
- sodium chloride — NaCl
- copper(II) sulfate — CuSO4
- sodium hydroxide — NaOH
- iron(III) chloride — FeCl3
- calcium chloride — CaCl2
- sodium carbonate — Na2CO3
- hydrochloric acid — HCl
- sodium bicarbonate — NaHCO3
- copper(II) carbonate — CuCO3
- copper(II) sulfate pentahydrate — CuSO4·5H2O

The catalog may change only when the chemistry specification is intentionally
updated.

---

## 8. Reaction presentation

A supported reaction may produce one or more visual effects.

Initial visual vocabulary:

- color change
- precipitate
- gas bubbles
- solid appearance change
- heating indication
- subtle temperature-change indication

Visual effects should communicate observable chemistry rather than attempt to
simulate microscopic molecular behavior.

---

## 9. Observation panel

When a reaction occurs, the application should show a short explanation.

An observation may contain:

- reaction name
- visible observation
- simplified chemical equation
- short educational explanation

The observation panel should not interrupt interaction.

It should supplement the virtual experiment.

---

## 10. Non-reacting combinations

When no registered reaction matches the current experiment, the application
should not invent behavior.

The user may see a subtle message such as:

`No observable reaction.`

This is a valid experiment outcome.

---

## 11. Reset behavior

The user must be able to reset the laboratory.

Reset restores:

- equipment positions where appropriate
- empty containers
- inactive alcohol lamp
- no active reaction effects
- default observation state

Reset does not require page reload.

---

## 12. Out of scope for MVP

The MVP does not include:

- backend
- login
- user accounts
- database
- persistence
- scoring
- grading
- teacher management
- student management
- multiplayer
- predefined course management
- AI assistance
- arbitrary chemical reactions
- complete chemical database
- exact reaction rates
- detailed thermodynamics
- pressure
- molecular visualization
- realistic laboratory certification or safety training

---

## 13. Product success criteria

The MVP is successful when a first-time user can open the laboratory and
without reading technical documentation:

- recognize the main workspace
- find chemicals
- find equipment
- add chemicals into a container
- cause at least one supported reaction
- understand the visible result
- heat a supported sample
- cause at least one heat reaction
- reset the laboratory
- freely try another experiment

The product should feel polished enough to demonstrate in a teaching context.
