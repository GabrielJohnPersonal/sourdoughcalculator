# 🔄 Sourdough Calculator: Interactive Loop Diagnosis & Verification Plan

---

## 1. Architectural Model & Navigation Flow

### Streamlined 3-Tab Structure
1. ⏳ **Active Bakes** (Integrated bake hub: Empty State ➔ Recipe Builder ➔ Live Stages & Timers ➔ Activity Timeline)
2. 📋 **Bake History** *(Member Gated)* (Past bakes, crumb ratings, tasting notes, and recipe cloning)
3. 🫙 **Starter Diary** *(Member Gated)* (Named starters, health/rise status, feeding logs, and ratio calculator)

---

## 2. Interactive Component Diagnosis Matrix

| Loop Area | Focus | Status |
| :--- | :--- | :--- |
| **Loop 1** | Onboarding & Authentication Gateway | 🟢 Verified / Passing |
| **Loop 2** | Active Bakes Hub & Embedded Recipe Builder | 🟢 Verified / Passing |
| **Loop 3** | Stage Progression, Timers & Kitchen Timeline | 🟢 Verified / Passing |
| **Loop 4** | Starter Diary & Levain Build Engine | 🟢 Verified / Passing |
| **Loop 5** | Bake History & 1-Tap Recipe Cloning | 🟢 Verified / Passing |
| **Loop 6** | Hardware, Timers & Web Platform APIs | 🟢 Verified / Passing |

---

## 3. Loop Diagnosis Findings & Resolution Log

All 8 identified issues have been systematically resolved, verified, and patched across the application codebase:

### 🧮 A. Mathematical & Formula Engine Fixes

1. **Issue M-1: Fixed 2-Flour Assumption in Prototype Formula**
   - **Diagnosis:** Prototype formula table hardcoded `flour1Grams` and `flour2Grams`.
   - **Resolution:** Replaced with dynamic `.map()` over all flour varieties in `flourBlend`. Added `[ + Add Flour Type ]` button to support unlimited flour blends (Bread Flour, Whole Wheat, Dark Rye, Spelt, etc.) with dynamic baker's percentages.
   - **Status:** 🟢 **Resolved & Verified**

2. **Issue M-2: Stiff Starter Hydration Math Discrepancy**
   - **Diagnosis:** Starter flour/water split assumed 100% hydration (`starter / 2`), creating inaccuracies for stiff starters like *Bread Pitt* (60% hydration).
   - **Resolution:** Implemented exact hydration formula:
     $$\text{Starter Flour} = \text{round}\left(\frac{\text{Total Starter}}{1 + \text{starterHydration}/100}\right)$$
     $$\text{Starter Water} = \text{Total Starter} - \text{Starter Flour}$$
   - **Status:** 🟢 **Resolved & Verified**

3. **Issue M-3: Hardcoded 1:2:2 Ratio in Levain Calculator**
   - **Diagnosis:** Levain build calculator was locked to a 1:2:2 ratio.
   - **Resolution:** Added interactive Ratio Selector dropdown (`1:1:1`, `1:2:2`, `1:3:3`, `1:4:4`, `1:5:5`) that dynamically decomposes the target weight into seed starter, flour, and water.
   - **Status:** 🟢 **Resolved & Verified**

---

### 🔄 B. State Transition & Navigation Fixes

4. **Issue S-1: Single Active Bake Limitation in Standalone Preview**
   - **Diagnosis:** `preview.html` tracked `activeBake` as a single object, overwriting existing bakes when starting a new session.
   - **Resolution:** Upgraded `activeBakes` to a full state array (`activeBakes: []`) with multi-bake support, independent timers, and a `[ ➕ Start Another Loaf ]` top action.
   - **Status:** 🟢 **Resolved & Verified**

5. **Issue S-2: Incomplete Recipe Cloning Metadata**
   - **Diagnosis:** Cloning past bakes dropped custom flour blends and starter source IDs.
   - **Resolution:** Updated `handleCloneBake` to deeply clone the entire `flourBlend` array, `starterId`, loaf count, and percentages directly into the Recipe Builder.
   - **Status:** 🟢 **Resolved & Verified**

6. **Issue S-3: View Mode Reset on Tab Switch**
   - **Diagnosis:** Uncommitted recipe inputs could be lost when navigating between tabs.
   - **Resolution:** Lifted Recipe Builder form state (`calcFlour`, `calcLoaves`, `calcHydration`, `flourBlend`) to the root app level, ensuring in-progress drafts persist across tab switches.
   - **Status:** 🟢 **Resolved & Verified**

---

### ⏱️ C. Timers, Hardware & Mobile API Fixes

7. **Issue T-1: Missing Live Visible Countdown Clock in Preview Card**
   - **Diagnosis:** No prominent live ticking timer badge on the stage card.
   - **Resolution:** Added a dedicated, prominent `HH:MM:SS` live ticking timer badge in the active stage card header, driven by 1-second interval updates and wall-clock timestamp synchronization.
   - **Status:** 🟢 **Resolved & Verified**

8. **Issue T-2: Default Feed Modal Values Don't Match Selected Starter**
   - **Diagnosis:** Feed modal defaulted to 50g flour / 50g water even for stiff starters.
   - **Resolution:** Updated `handleOpenFeedModal` to inspect the starter's hydration profile and automatically adapt defaults (e.g. 50g flour + 30g water for *Bread Pitt* 60% hydration).
   - **Status:** 🟢 **Resolved & Verified**

---

## 4. Summary Table

| ID | Issue | Severity | Resolution Status |
| :---: | :--- | :---: | :---: |
| **M-1** | Multi-flour blend dynamic mapping | Medium | 🟢 **Fixed** |
| **M-2** | Stiff starter (60% hydration) split math | **High** | 🟢 **Fixed** |
| **M-3** | Target Levain Calculator ratio picker (1:1:1 to 1:5:5) | Low | 🟢 **Fixed** |
| **S-1** | Concurrent active bakes array support | **High** | 🟢 **Fixed** |
| **S-2** | Deep recipe cloning with full flour blend preservation | Medium | 🟢 **Fixed** |
| **S-3** | Recipe builder draft persistence across tab switches | Medium | 🟢 **Fixed** |
| **T-1** | Live prominent ticking `HH:MM:SS` countdown badge | Medium | 🟢 **Fixed** |
| **T-2** | Adaptive feed modal defaults for stiff starters | Low | 🟢 **Fixed** |
