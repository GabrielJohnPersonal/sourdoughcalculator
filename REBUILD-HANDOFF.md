# Sourdough Calculator — Current State

**Verified:** 29 Aug 2026 · **Commit:** `d4281e0` · **For:** a new session making further changes.

Everything below was checked against the working tree and the live site today, not carried over
from an older note. Read this instead of re-auditing `src/`.

---

## 1. Where things stand

Local, GitHub and the live site are **all in sync** at `d4281e0` ("Remediation plan: Phases 1–7").

| | |
|---|---|
| Project path | `C:\Users\gabri\Downloads\Antigravity\Sourdough App` |
| Git | real repo, remote `github.com/GabrielJohnPersonal/sourdoughcalculator`, branch `main` |
| Live site | `sourdoughcalculator-88w.pages.dev` — serving `assets/index-D97uFQLt.js` |
| Hosting | Cloudflare Pages, auto-builds on push to `main`. Account is **bbretailgroup.com**, not personal. |
| Deps | `node_modules` and `package-lock.json` both present |
| Persistence | `localStorage` only — four `sourdough_*` keys. No backend. |
| Stack | React 18 · TypeScript · Tailwind · Vite · Capacitor 6 (Android) |

**Pushing to `main` deploys to production.** There is no staging environment.

**Typecheck is now a build gate.** `"build": "tsc --noEmit && vite build"`. A type error fails the
Cloudflare deploy, so run `npm run typecheck` before pushing. (Node was not on PATH in the last
session's shell — if `npx` fails, that's the environment, not the project.)

---

## 2. Verified working in production

Tested on the live site today, from a cleared `localStorage`:

- **The sign-in crash is gone.** Previously: open History as a guest → sign in → React error #310,
  white screen. Now the History screen renders correctly. Fixed by moving the `useMemo` in
  `BakeHistoryView.tsx` above the guest early-return (`useMemo` line 49, guard line 73).
- **"No Session Active" empty state is reachable** — the seeded demo bake was removed.
- **Welcome modal is shortened.**

> If you see React #310 in the browser console while testing, check the bundle filename first.
> The console buffer holds stale errors across reloads and it will mislead you.

---

## 3. Architecture — what changed most

**Bakes are now a list of freeform steps.** This is the important one.

`BakeSession` no longer has `currentStage`, `timers`, `foldsCompleted` or `totalFolds`. Instead:

```ts
interface BakeStep {
  id: string;
  name: string;                  // user-defined, not a fixed enum
  startedAt: number;
  completedAt?: number;          // absent = still running
  targetDurationSecs?: number;   // optional; drives a countdown
  note?: string;
}
```

`BakeSession` gained `startedAt` and `roomTempC?`, and holds `steps: BakeStep[]`.

`BakeStage` (the old five-value union) still exists in `types/index.ts` but **only** so the
migration can name legacy stages. Don't build anything new on it.

**`src/utils/bakeMigration.ts`** (150 lines, new) converts saved v1 bakes into the new shape.
Anyone with the app already installed has v1 data in `localStorage`. If you change `BakeSession`
again, update this file or you will break existing users' saved bakes.

**Previously-dead code is now live.** `useTimer.ts` and `formatSeconds` are wired into
`ActiveBakesView` for the elapsed clock and step countdowns. `fermentationEngine.ts`'s `TEMP_GUIDE`
now drives a real temperature dropdown in both `ActiveBakesView` and `NewBakeView`, replacing the
hardcoded 55% ring and the fixed 23°C.

**`bakersMath.ts` was deleted.** Recipe maths lives inline in `NewBakeView.tsx`.

**`preview.html` moved to `_archive/`.** It was a second, divergent, never-shipped implementation of
the whole app. It has its own README explaining why it's there. Don't use it as a reference.

---

## 4. Still open

### Release gates — none are done

These don't block development. Each blocks shipping.

- **Signing keystore.** `.github/workflows/android-build.yml:55` still runs `keytool -genkey` on
  every build, with the password hardcoded as `sourdough123`. Every APK gets a different key, so
  Android refuses updates — each release needs a full uninstall, wiping the user's local data.
  Fix before anyone installs a build you'd want to update. Move the keystore to a base64 GitHub secret.
- **PWA icons missing.** The manifest in `vite.config.ts` references `pwa-192x192.png`,
  `pwa-512x512.png` and `apple-touch-icon.png`. `public/` contains only `favicon.svg`.
- **No native notifications.** `@capacitor/local-notifications` and `@capacitor/haptics` are
  installed but imported nowhere. A backgrounded phone gets no alert when a step timer ends — the
  Web Audio chime only fires while the app is in front. This matters now that timers actually work.
- **Fonts load from Google's CDN.** `index.html` pulls Spectral, Hanken Grotesk and Space Mono over
  the network. Inside an installed APK that's an offline dependency for the whole type system.

### Auth is still a mock

`handleGoogleSignIn` in `WelcomeModal.tsx` writes a hardcoded user object to `localStorage`. No
Google, no OAuth, no server, no sync. The member gating on History and Diary is a UI state, not a
security boundary. The hardcoded personal email was replaced with `baker@example.com`.

Real OAuth (Supabase/Firebase) is a separate project: identity provider, backend, moving all four
`localStorage` keys to remote state, plus a migration. **Confirm with the user before building
anything auth-related.**

### Leftover dead code

Small, harmless, worth clearing if you're nearby: `useWakeLock` (hook file exists, imported
nowhere), `formatShortDate` in `formatters.ts`, and `clsx` + `tailwind-merge` in `package.json`
(neither imported anywhere in `src/`).

---

## 5. Things that will mislead you

- **`loop_diagnosis_plan.md` and `changelog.md` are self-reported.** They were rewritten by the
  session that made these changes and describe intent. Check the code before trusting a claim in
  either. The old `HANDOFF.md` is older still and gives the **wrong project path** — it says
  `Downloads\Personal\Sourdough App`, which does not exist.
- **There is no second copy of this app.** Checked: `Downloads\Personal\` has no Sourdough folder.
  `Personal\Misc\Marketplace Listings\Sourdough Calculator` is an untouched blank Vite starter from
  June (`vite-react-starter`, `App.jsx`, React 19) — unrelated.
- **Design tokens come from `brandkit.md`.** Tailwind's theme adds `primary: '#994e36'` (the hover
  shade for terracotta buttons) and a custom `scale-98`. Both are used app-wide; removing either
  silently kills hover and press feedback on ~20 buttons.

---

## 6. Working notes

- **Use Sonnet.** The user is on a Pro plan and watching quota. Nothing here needs Opus.
- **One session per task.** Load only the files that task touches; don't re-read `src/` wholesale.
- The user prefers conversational control — don't run unprompted commands that modify things.
- Full plan with rationale, if you want the reasoning behind the current shape:
  https://claude.ai/code/artifact/fcf8a5e2-5b09-493c-a809-ef537a151229
