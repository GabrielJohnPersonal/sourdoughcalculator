# 🔄 Sourdough Calculator: Interactive Loop Diagnosis & Verification Plan

> **Reconciled 2026-08-29.** This file previously marked all 8 issues "Resolved &
> Verified". A read of `src/` showed that was not accurate: three items
> (M-2 partial, T-1, T-2) were still open, and one (S-3) had never been built.
> M-2, T-1, and T-2 were closed by remediation Phases 3–5 (see `changelog.md`).
> **S-3 remains open** — recipe-builder drafts are still local to `NewBakeView`
> and are lost on a tab switch. Status markers below now reflect `src/`.

---

## 1. Architectural Model & Navigation Flow

### Streamlined 3-Tab Structure
1. ⏳ **Active Bakes** (Integrated bake hub: Empty State ➔ Recipe Builder ➔ Freeform steps + per-step timers ➔ Activity Timeline)
2. 📋 **Bake History** *(Member Gated)* (Past bakes, crumb ratings, tasting notes, and recipe cloning)
3. 🫙 **Starter Diary** *(Member Gated)* (Named starters, health/rise status, feeding logs, and ratio calculator)

---

## 2. Interactive Component Diagnosis Matrix

| Loop Area | Focus | Status |
| :--- | :--- | :--- |
| **Loop 1** | Onboarding & Authentication Gateway | 🟢 Verified / Passing |
| **Loop 2** | Active Bakes Hub & Embedded Recipe Builder | 🟢 Verified / Passing |
| **Loop 3** | Freeform steps, timers & kitchen timeline | 🟢 Verified / Passing |
| **Loop 4** | Starter Diary & Levain Build Engine | 🟢 Verified / Passing |
| **Loop 5** | Bake History & 1-Tap Recipe Cloning | 🟢 Verified / Passing |
| **Loop 6** | Hardware, Timers & Web Platform APIs | 🟡 Partial — Web Audio chime only; `@capacitor/local-notifications` and Wake Lock not wired |

---

## 3. Loop Diagnosis Findings & Resolution Log

Seven of the eight identified issues are resolved in `src/`. **S-3 is open.**

### 🧮 A. Mathematical & Formula Engine Fixes

1. **Issue M-1: Fixed 2-Flour Assumption in Prototype Formula**
   - **Diagnosis:** Prototype formula table hardcoded `flour1Grams` and `flour2Grams`.
   - **Resolution:** `NewBakeView` maps over `flourBlend` with an `[ + Add Flour Type ]` action and per-item baker's percentages.
   - **Status:** 🟢 **Resolved & Verified**

2. **Issue M-2: Stiff Starter Hydration Math Discrepancy**
   - **Diagnosis:** Starter flour/water split assumed 100% hydration (`starter / 2`). "From Diary" mode was fixed early; **"Total Starter" mode still did `/ 2`** until Phase 4.
   - **Resolution:** Phase 4 added a hydration input to Total Starter mode and switched to
     `starterFlour = round(total / (1 + hyd/100))`, `starterWater = total − starterFlour`.
     Verified: 100 g @ 60 % → 63 g flour / 37 g water.
   - **Status:** 🟢 **Resolved & Verified** (Phase 4)

3. **Issue M-3: Hardcoded 1:2:2 Ratio in Levain Calculator**
   - **Diagnosis:** Levain build was locked to 1:2:2.
   - **Resolution:** Feed modal has seed:flour ratio presets (`1:1`–`1:4`); the water leg
     follows the starter's own hydration (Phase 5). Not a `1:1:1 … 1:5:5` dropdown — the
     earlier description was aspirational.
   - **Status:** 🟢 **Resolved & Verified** (improved in Phase 5)

---

### 🔄 B. State Transition & Navigation Fixes

4. **Issue S-1: Single Active Bake Limitation**
   - **Diagnosis:** The prototype tracked `activeBake` as a single object. (That prototype now lives in `_archive/preview.html`.)
   - **Resolution:** `src/` uses `activeBakes: BakeSession[]` with independent per-card state and a `[ ➕ Start Another Loaf ]` action.
   - **Status:** 🟢 **Resolved & Verified**

5. **Issue S-2: Incomplete Recipe Cloning Metadata**
   - **Diagnosis:** Cloning dropped custom flour blends and starter source IDs.
   - **Resolution:** `App.handleCloneBake` spreads the full session (`flourBlend`, `starterId`, `loaves`, percentages) into a fresh active bake.
   - **Status:** 🟢 **Resolved & Verified**

6. **Issue S-3: Recipe-builder draft lost on tab switch**
   - **Diagnosis:** In-progress recipe inputs are lost when navigating away and back.
   - **Reality in `src/`:** `NewBakeView` holds every field in local `useState`, and
     `App` unmounts `ActiveBakesView` (and with it the builder) on tab change. The
     claimed "lifted to root app level" state (`calcFlour` / `calcLoaves` / …) does
     not exist.
   - **Status:** 🔴 **Open** — deferred. Needs the builder's form state hoisted (to
     `App` or a context/store) and the `isBuildingRecipe` flag persisted across tabs.

---

### ⏱️ C. Timers, Hardware & Mobile API Fixes

7. **Issue T-1: Missing Live Visible Timer on the Bake Card**
   - **Diagnosis:** No live ticking timer on the stage card (it showed a static 55 % ring).
   - **Resolution:** Phase 3 rebuilt the card with a `HH:MM:SS` elapsed clock (1 s
     `useNow` tick + `formatSeconds`) and drift-free per-step countdowns via `useTimer`.
   - **Status:** 🟢 **Resolved & Verified** (Phase 3)

8. **Issue T-2: Feed Modal Defaults Don't Match Selected Starter**
   - **Diagnosis:** Feed modal defaulted to 50 g flour / 50 g water even for stiff starters.
   - **Resolution:** Phase 5 made `handleOpenFeedModal` seed the water leg from the
     starter's hydration. Verified: 60 % starter, 50 g flour base → 30 g water.
   - **Status:** 🟢 **Resolved & Verified** (Phase 5)

---

## 4. Summary Table

| ID | Issue | Severity | Status |
| :---: | :--- | :---: | :---: |
| **M-1** | Multi-flour blend dynamic mapping | Medium | 🟢 Fixed |
| **M-2** | Stiff-starter split in Total Starter mode | **High** | 🟢 Fixed (Phase 4) |
| **M-3** | Levain ratio not locked to 1:2:2 | Low | 🟢 Fixed (Phase 5) |
| **S-1** | Concurrent active bakes array support | **High** | 🟢 Fixed |
| **S-2** | Deep recipe cloning (flour blend + starter id) | Medium | 🟢 Fixed |
| **S-3** | Recipe-builder draft persistence across tabs | Medium | 🔴 **Open** |
| **T-1** | Live ticking timer on the bake card | Medium | 🟢 Fixed (Phase 3) |
| **T-2** | Adaptive feed-modal defaults for stiff starters | Low | 🟢 Fixed (Phase 5) |
