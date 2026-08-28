# _archive

Files kept for reference only. **Nothing here is part of the build.**
Vite compiles `src/`, `public/`, and `index.html`; this folder is ignored by
Vite and by `tsconfig.json` (`include: ["src"]`).

## preview.html

A single-file, CDN-React prototype of the whole app (Tailwind CDN, Babel in the
browser, no build step). It diverged from `src/` and was never shipped — Vite
does not copy stray root HTML files into `dist/`.

It is **not** the source of truth. The shipping app is `src/`. Known ways the
prototype is behind:

- tracks a single `activeBake` object (no concurrent bakes)
- fixed five-stage methodology (`currentStage` / `timers`), replaced in `src/`
  by the freeform `steps: BakeStep[]` model
- hard-coded feed ratios and progress values
- carried a personal email in its mock sign-in

Delete this folder whenever you no longer want the prototype around.
