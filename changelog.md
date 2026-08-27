# 📝 Sourdough Calculator — Product Changelog

This document tracks all user-requested design decisions, feature iterations, and architectural adjustments in chronological order.

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
