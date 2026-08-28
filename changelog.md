# 📝 Sourdough Calculator — Product Changelog

This document tracks all user-requested design decisions, feature iterations, and architectural adjustments in chronological order.

---

## [2026-08-29] — Phase 6: Welcome Screen + Phase 7: Cleanup (Remediation Plan)

Final two phases of the remediation plan.

### 👋 Phase 6 — Welcome screen (`src/components/layout/WelcomeModal.tsx`)

* **"What's New" cut to one line.** Three bullets → a single sentence: "Custom bake steps with drift-free wall-clock timers, a temperature-based bulk-fermentation estimate, and starters at any hydration." The "drift-free wall-clock timers" claim was false when the roadmap was written; Phase 3 (`useTimer` adoption) made it true, so it stays.
* **Bakery Spotlight promo removed.** The "15% off Handcrafted Rattan Bannetons — code CRUST15" tile was the largest single block in a modal meant to be short, and read as placeholder content. Removed, along with the now-unused `Tag` icon import. *(If CRUST15 was a real partnership, it's a small block to restore.)*

### 🧹 Phase 7 — Cleanup

* **`preview.html` quarantined** to `_archive/preview.html` with a README explaining it's a divergent, never-shipped CDN-React prototype and not the source of truth. Kept rather than deleted since the repo isn't under version control.
* **`loop_diagnosis_plan.md` reconciled.** It claimed all 8 diagnosed issues were "Resolved & Verified"; a read of `src/` showed otherwise. M-2 (Total Starter split), T-1 (live timer), and T-2 (feed-modal defaults) were genuinely closed by Phases 4/3/5 and are now marked as such. **S-3 (recipe-builder draft persistence across tab switches) was never implemented** and is now marked 🔴 Open with a note on what it needs.
* **`src/utils/bakersMath.ts` deleted.** 182 lines of `calculateRecipe` / `calculateLevain`, imported nowhere. The inline math in `NewBakeView` is the tested, authoritative version (reworked and verified in Phase 4). A clean pure-function extraction can be its own deliberate refactor later.
* **Dead references removed.** The unused `useWakeLock` import in `App.tsx` (the hook file stays — it's a documented planned feature); `clsx` and `tailwind-merge` dropped from `package.json` (zero usages in `src/`).
* **Lockfile.** `package-lock.json` is now committed (regenerated after the dependency removal), so CI stops resolving fresh versions on every build.

---

## [2026-08-29] — Phase 4: New Bake Setup + Phase 5: Starter Diary (Remediation Plan)

### 🍞 Phase 4 — New Bake setup (`src/components/new-bake/NewBakeView.tsx`)

* **Editable bake name.** A "Name this bake" field at the top of setup, pre-filled (as a placeholder, not forced) with the same suggestion the app used to auto-assign — `{Starter} Loaf` from a diary starter, otherwise "Country Sourdough". Type to override; leave blank to accept the suggestion.
* **Room-temperature control.** A dropdown (18–27 °C, shared `TEMP_GUIDE` scale) in Section 1, written to `session.roomTempC`. The Phase 3 bulk-fermentation estimate now starts from the real value instead of a hard-coded 23 °C.
* **Total Starter mode — hydration fixed.** The mode did `starter / 2` regardless of the starter, so every levain came out at 100 % hydration. It now takes a hydration input alongside the grams field and splits `total / (1 + hyd/100)`; a 100 g entry at 60 % → 63 g flour / 37 g water, shown in a live caption.
* **Guest "From Diary" — phantom starter fixed.** A signed-out user landed in From Diary mode, which silently pulled a saved starter (100 g, 100 % hydration) into the formula with no visible control. Guests now default to Total Starter mode, and the diary calculation only runs when a user is actually signed in.

### 🫙 Phase 5 — Starter Diary (`src/components/starter/StarterDiaryView.tsx`, `src/App.tsx`)

* **Hydration on starter creation.** The "Add Starter" modal had no hydration field and hard-coded `100`, so a stiff starter couldn't be recreated. It now has a hydration input (default 100, hint to go lower for stiff), and the seed feed entry is built to match.
* **Delete a starter.** New `onDeleteStarter` handler in `App.tsx`; each card gets a trash control that swaps the bottom bar for an inline "Delete {name}? / Cancel / Delete" confirm. No delete path existed at any layer before.
* **Status pill moved down.** The Active & Peak / Hungry badge moved from the top-right corner into the bottom bar, next to the progress meter. The redundant "Status" metric column was dropped (metrics are now Last Fed / Last Ratio).
* **Feed button moved up.** "Feed" moved to the top-right where the pill was, restyled black (`bg-ink`) with a leading `+`.
* **Honest progress bar.** Was hard-coded to `w-[85%]` when peaking and `w-[25%]` otherwise. Now it's elapsed-since-last-feed over projected-time-to-peak, with a matching label ("81 % to peak" / "Past peak — feed soon" / "Not fed yet").
* **Feed modal respects hydration.** It forced a 1:2:2 (50/50 flour-water) ratio on open. Ratio presets are now seed:flour only (`1:1`–`1:4`) and the water leg follows the starter's own hydration — a 60 % starter fed from a 50 g flour base now gets 30 g water, not 50 g. The saved ratio string is derived from the actual grams.

---

## [2026-08-28] — Phase 3: Rebuild the Active Bakes Card (Remediation Plan)

The redesign the whole plan builds toward. The Active Bakes card is rebuilt on the Phase 2 `steps` model — stripped to name + time, then given the two things that make it useful: freeform step logging and a fermentation estimate that actually moves. All in `src/components/active/ActiveBakesView.tsx`; each card is now its own `<BakeCard>` component so it can hold hooks.

### ⏱️ 1. Ticking Elapsed Clock
* The card header shows the bake name, `Started 9:53 PM`, and a live `H:MM:SS` elapsed clock that ticks every second.
* Adopts two modules that were written months ago and imported nowhere: `formatSeconds` (`src/utils/formatters.ts`) for the readout, and `useTimer` (`src/hooks/useTimer.ts`) for the per-step countdowns below. A small `useNow()` hook drives the count-up.

### 📝 2. `[+ Log step]` — Freeform Step Logging
* Replaces the fixed autolyse → folds → bulk → retard → bake stepper with an open list. Tap **Log step**, give it any name (Autolyse, Coil fold, Shape…), optionally set a timer in minutes, optionally add a note.
* A step with a timer shows a drift-free countdown (wall-clock based, via `useTimer`) and chimes at zero; a step without one shows elapsed time. Either way a **Done** button stamps the completion time, and completed steps collapse to a `9:53 PM – 10:41 PM` range.
* Every log / complete action is also written to the activity timeline.

### 🌡️ 3. Bulk Fermentation Estimate That Moves
* Replaces the literal `55%` progress ring and the hard-coded `4:30 PM` fallback.
* A room-temperature dropdown (18–27 °C, from the existing `TEMP_GUIDE` table) is bound to `session.roomTempC`. Changing it re-runs `getFermentationSuggestion` and updates, live: estimated bulk duration, target rise %, an estimated-ready clock time, and a progress bar showing **real** elapsed-vs-estimate percentage. Example: 23 °C → "≈ 8h · est. ready 5:53 AM"; drop to 20 °C → "≈ 14h · est. ready 11:52 AM".

### 🗑️ 4. Discard Action
* A **Discard** button in the footer, visually distinct from **Mark bake complete**, with an inline "Discard this bake? / Keep" confirm.
* Connects `onArchiveSession` — a handler that already existed in `App.tsx` and had never been wired to anything. Discarding moves the bake out of Active and into history with `status: 'archived'`.

### 🧹 5. Removed
* The stage stepper dots, the "Stage X/5" pill, the "Autolyse completed" hand-off prompt, the stretch-and-folds progress dots, and the Log Fold button were already deleted in Phase 2; this phase removes the last of the fixed-methodology scaffolding (the static ring) and the now-unused `getFermentationSuggestion` import is back in use for real.

---

## [2026-08-28] — Phase 2: Rewrite the Bake Data Model (Remediation Plan)

The keystone phase. The fixed five-stage methodology was baked into the `BakeSession` shape; custom user-defined steps can't sit on top of it. This phase replaces the shape and migrates existing data. The Active Bakes screen itself is rebuilt in Phase 3 — here it's only adapted enough to compile and run on the new model.

### 🧱 1. New `BakeSession` Shape
* **Dropped** `currentStage: BakeStage`, the six-key `timers` object, `foldsCompleted`, and `totalFolds` — every field that encoded the fixed autolyse → folds → bulk → retard → bake flow.
* **Added** `steps: BakeStep[]` — a freeform list the baker builds during a bake. Each `BakeStep` carries `id`, `name` (user-defined), `startedAt`, optional `completedAt`, optional `targetDurationSecs`, optional `note`.
* **Added** `startedAt: number` (wall-clock ms the bake began).
* **Renamed** `roomTemp?` → `roomTempC?` and made it explicit that the value is °C.
* Removed the now-unused `StageTimerState` interface. `BakeStage` is kept solely so the migration can label the old stages.

### 🔄 2. Versioned localStorage Migration (`src/utils/bakeMigration.ts`)
* New keys: `sourdough_active_bakes_v2`, `sourdough_bake_history_v2`. The v1 keys are left in place as a fallback and never deleted.
* On startup, `runBakeMigrations()` converts any v1 data into the v2 keys once (idempotent — skips if the v2 key already exists).
* Each legacy bake maps its reached stages onto `steps` (e.g. `currentStage: 'bulk_ferment'` → three steps: Autolyse, Stretch & folds, Bulk fermentation), carries `timers[*].durationSecs` onto `targetDurationSecs`, derives `startedAt` from the earliest timeline entry, and renames `roomTemp` → `roomTempC`. The activity timeline is preserved untouched.

### 🌱 3. Fresh-Install Seed Data
* **Removed `INITIAL_ACTIVE_BAKE`.** A fake "Country Loaf" was seeded into every new install, which is why the "No Session Active" empty state (built but unreachable) never showed. New installs now start with an empty Active Bakes screen.
* **Removed `INITIAL_HISTORY`** (the three demo bakes). A real first run no longer shows loaves the user never baked.
* **Kept `INITIAL_STARTERS`** (Doughlene, Bread Pitt) — the Starter Diary and New Bake's "From Diary" mode stay demoable, and starters are the least confusing to inherit.

### 🔧 4. Components Adapted to the New Shape
* **`NewBakeView`** and **`App.handleCloneBake`** now build sessions with `startedAt` + `steps: []` and no timers/stage/fold fields. `roomTempC` stays hard-coded to 23 until Phase 4 adds a setup control.
* **`ActiveBakesView`** — removed `handleStageChange`, `handleAddExtraTime`, `handleLogFold`, the stage stepper dots, the "Stage X/5" pill, the "Autolyse completed" hand-off prompt, the stretch-and-folds progress dots + Log Fold button, and the hard-coded 55% bulk-fermentation ring. The card now renders `session.steps` as a plain list plus the existing activity timeline. Interactive step logging, the live fermentation estimate, the ticking elapsed clock, and the Discard action are Phase 3.
* **`BakeHistoryView`** needed no changes — it never referenced the dropped fields.

---

## [2026-08-28] — Phase 1: Stop the Bleeding (Remediation Plan)

First phase of the remediation & feature roadmap. Fixes only — no redesign. Everything here is a visible improvement at near-zero risk.

### 🩹 1. Bake History Crash on Sign-In (React #310)
* **Root cause**: `BakeHistoryView` ran six `useState` hooks, then an early `return` for guests, then a `useMemo`. Signing in from inside the History tab flipped `user` from `null` to populated, so the same mounted component re-rendered and executed a seventh hook — "Rendered more hooks than during the previous render", white screen, reload the only recovery.
* **Fix**: Moved the `filteredHistory` `useMemo` above the guest early-return so the hook count is identical for guests and members. This resolves both the blank-History-after-login report and the "Continue with Google doesn't work" report — they were the same bug.

### 🎨 2. Dead Tailwind Utilities Now Generate CSS
* **`bg-primary`**: `hover:bg-primary` sits on every accent button (`bg-terracotta hover:bg-primary`) across seven call sites but was never defined, so accent buttons had no hover state. Added `primary: '#994e36'` — a pressed/hover shade of terracotta (~13% darker, same hue, still the one accent).
* **`scale-98`**: `active:scale-98` drives the press animation on ~15 buttons app-wide but isn't a default Tailwind step, so it silently emitted nothing. Added `scale: { 98: '0.98' }` to the theme.

### 🔒 3. Removed Hardcoded Personal Identity from Mock Auth
* `handleGoogleSignIn` in `WelcomeModal.tsx` wrote a real personal Gmail address and first name into the mock user object saved to localStorage. Replaced with neutral placeholder identity (`baker@example.com` / "Baker") and a comment noting this is still a local mock, not real OAuth.

### 🛠️ 4. Build Now Typechecks
* `npm run build` was `vite build` alone, which does no typechecking (`tsc` never ran, `strict` is off). Changed to `tsc --noEmit && vite build` and added a standalone `typecheck` script. CI (`android-build.yml`) runs `npm run build`, so type regressions now fail the pipeline instead of shipping.

---

## [2026-08-28] — Recipe Matrix UI Refactor, Dual-Mode Feed Engine & Interactive Loaf Journal

### 🧹 1. Global Navigation & Header Polish
* **Removed Redundant Header Button**:
  * Eliminated the confusing "Sleep" button from the top navigation bar, creating a clean header with the page title and user profile/auth avatar.

### 🌾 2. Recipe Builder & Flour Blend Matrix
* **Flour Blend Input Optimization**:
  * Decreased the horizontal footprint of the flour name text field so it no longer takes up disproportionate row space.
  * Enlarged the percentage input width (`w-20` / `w-24`) to ensure 3-digit percentages (e.g. `100%`) render without truncation or container clipping.
* **100% Bread Flour Default**:
  * New recipes default strictly to **100% Bread Flour** (removed `Whole Wheat 20%` from initial template).
* **Dynamic Blend Auto-Balancing**:
  * Removing secondary flour varieties via the `X` button automatically recalculates and resets the primary flour back to **100%**.
* **Consolidated Live Formula Presentation**:
  * Replaced the separate `Starter Flour` and `Starter Water` rows in the formula breakdown table with a single unified row: `Starter: [Total]g ([Flour]g flour / [Water]g water)` derived dynamically from starter hydration.

### 🫙 3. Starter Diary & Dual-Mode Feeding Engine
* **Interactive Starter Feeding Journal**:
  * Converted starter summary cards (*Doughlene*, *Bread Pitt*) into interactive elements. Tapping a card opens a full **Feeding Journal Modal** displaying past timestamps, ratios, flour varieties, target vs actual weights, and fermentation notes.
* **Target Levain Calculator Integration**:
  * Removed the permanently anchored bottom calculator block from the Starter Diary screen.
  * Integrated a **Dual-Mode Feeding Calculator** inside the **Log Feed (+)** modal:
    * **Ratio Mode**: Select ratio presets (`1:1:1`, `1:2:2`, `1:3:3`, `1:4:4`). Adjusting target flour dynamically scales Seed Starter and Water.
    * **Manual Mode**: Unlinked mode allowing direct, independent gram entry for Seed, Flour, and Water.
* **Live Feed Status Refresh**:
  * Submitting a feeding logs the entry to the starter's chronological history, recalculates the relative "Last Fed" timer, and refreshes the health indicator to `Active & Peak`.

### 📖 4. Bake History, Log Archiving & Journaling
* **Timeline Archiving**:
  * Marking a bake complete migrates the active session timeline (autolyse intervals, stretch & fold timestamps, bulk fermentation progress) into the permanent history record.
* **Interactive Loaf Journal**:
  * Tapping any bake in the **Bake History** tab opens a detailed **Loaf Journal Modal** allowing review of the formula, inspection of the full activity timeline, and editing of sensory ratings (1–5 stars) and tasting/crumb evaluation notes.
* **Multi-Factor Search & Sort**:
  * Added a search filter supporting loaf titles, flour blends, and notes.
  * Added functional sorting drawer (Newest, Oldest, Hydration High to Low, Highest Rating).

---

## [2026-08-27] — Android Standalone Native App (.APK) Architecture

### 🤖 Native Android Packaging (Capacitor 6)
* **Capacitor Configuration**:
  * Created `capacitor.config.json` defining `appId: com.sourdoughcalculator.app` and `appName: Sourdough Calculator`.
  * Added native plugins for Android: `@capacitor/android`, `@capacitor/haptics`, `@capacitor/local-notifications`.
* **Automated Cloud APK Build Workflow**:
  * Created `.github/workflows/android-build.yml` to compile a native standalone Android `.apk` directly inside GitHub Actions.
  * Allows downloading and installing the standalone Android APK directly on physical Android phones without needing local Android Studio installs.

---

## [2026-08-27] — Banneton Size Conditional Flour Input & Inline Parameters Row

### 🥖 Section 1: Loaf & Banneton Refinement
* **Target Banneton Size Presets & Smart Flour Visibility**:
  * Set default Banneton sizing chips:
    * **Small** (300g flour — fits small ~7" banneton)
    * **Medium** (400g flour — fits medium ~8.5" banneton)
    * **Large** (500g flour — fits large ~10" banneton)
    * **Custom**
  * **Hidden Total Flour Field**: When `Small`, `Medium`, or `Large` is active, the Total Flour numerical input is hidden to eliminate redundant fields. The Total Flour input only renders when **Custom** is selected.
* **Inline Single-Row Parameters**:
  * Combined **Loaves**, **Hydration (%)**, and **Salt (%)** into a single clean 3-column row directly beneath the Banneton size selector.

---

## [2026-08-27] — Loaf Size Presets & Independent Starter Input Architecture

### 🥖 Section 1: Loaf & Banneton Sizing
* **Banneton-Aligned Loaf Size Selector**:
  * Added visual size selection chips (Small, Medium, Large, Custom).
  * Dedicated Loaves stepper (`[-] 1 [+]`).
  * Hydration selector (% input) and Salt % directly within the Loaf section.

### 🫙 Section 2: Independent Starter Input (No Forced % Notation)
* **Separated Starter Input Modes**:
  * Removed the forced abstract "Starter is 20%" requirement.
  * **1. Diary Selection with Preview Card**:
    * Selecting a starter displays a dedicated preview card pulling its flour profile, hydration %, health status, and feeding history.
    * Prominent `[ Use This Starter ]` confirmation and grams-to-use input.
  * **2. Total Starter Grams Mode**:
    * Enter total starter weight directly in grams (e.g., 100g).
  * **3. Manual Flour & Water Breakdown Mode**:
    * Directly input **Starter Flour (g)** and **Starter Water (g)** for custom stiff levains or discard recipes.

---

## [2026-08-27] — UX Streamlining & Navigation Consolidation

### 🔄 Architectural & Navigation Changes
* **Consolidated 3-Tab Bottom Navigation**:
  * Removed standalone `New Bake` tab from the bottom bar.
  * Bottom navigation streamlined to 3 core tabs:
    1. ⏳ **Active Bakes**
    2. 📋 **Bake History** *(Member Gated)*
    3. 🫙 **Starter Diary** *(Member Gated)*
* **Integrated Recipe Builder Workflow**:
  * Moved the **New Bake** calculator inside the **Active Bakes** hub.
  * When no bake is active $\to$ shows *"No Session Active"* empty state card with `[ ➕ Start New Bake ]`.
  * Added `[ ➕ Start Another Loaf ]` top action to allow multiple concurrent bakes.
