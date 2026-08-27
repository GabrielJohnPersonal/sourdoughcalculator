# 📝 Sourdough Calculator — Product Changelog

This document tracks all user-requested design decisions, feature iterations, and architectural adjustments in chronological order.

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
