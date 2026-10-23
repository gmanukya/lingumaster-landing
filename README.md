# lingumaster-landing

French landing page for Lingumaster. One static page, built for a phone opened from the TikTok bio link.

Stack: Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, static export (`output: 'export'`). Styles are CSS Modules plus CSS variables in `src/styles/tokens.css`. Node is pinned to 22.23.4 (`.nvmrc` and `engines`).

```bash
npm ci
npm run build
npm run lint
npm run typecheck
npm run serve
```

`npm run serve` serves the `out/` directory on port 4173. Copy lives only in `src/content/fr.ts`, taken verbatim from `copy/copy-new-v1.md`. While `COPY_STATUS` is not `approved`, every page shows a BROUILLON ribbon.

No hosting, analytics, or third-party requests are set up here.
