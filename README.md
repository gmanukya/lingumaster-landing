# lingumaster-landing

French landing page for Lingumaster. One static page, built for a phone opened from the TikTok bio link.

Stack: Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, static export (`output: 'export'`). Styles are CSS Modules plus the Design D tokens in `src/styles/tokens.css`. Node is pinned to 22.23.4 (`.nvmrc` and `engines`).

```bash
npm ci
npm run build
npm run lint
npm run typecheck
npm run serve
```

`npm run serve` serves the `out/` directory on port 4173. Writer copy lives only in `src/content/fr.ts`, taken verbatim from `copy/copy-new-v1.md`. While `COPY_STATUS` is not `approved`, every page shows a BROUILLON ribbon.

Screen slots are `hero-library`, `shot-library` and `shot-reader`. Until a 1290×2796 capture is added under `src/assets/screens/`, each slot renders a labelled placeholder with `data-placeholder="true"`. There is no price on the page. The App Store badge is an empty slot for the next task.

Inter is one self-hosted variable file in `public/fonts/` (wght 400–600, opsz 14–32). That file is the only font preload. The Next.js runtime scripts are moved to the window `load` event after the build, so the font and the CSS are not queued behind the framework download. No hosting, analytics, or third-party requests are set up here.
