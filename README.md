# lingumaster-landing

French landing page for Lingumaster. One static page, built for a phone opened from the TikTok bio link.

Stack: Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, static export (`output: 'export'`). Styles are CSS Modules plus the Design D tokens in `src/styles/tokens.css`. Node is pinned to 22.23.4 (`.nvmrc` and `engines`).

```bash
npm ci
npm run build
npm run lint
npm run typecheck
npm test
npm run serve
```

`npm run serve` serves the `out/` directory on port 4173. `npm run check:launch` is the launch gate (placeholders, price, `SITE_URL`, `netlify.toml`, contact, badge hash). It fails until those are cleared. `LAUNCH.md` is the human deploy list. Canonical URLs are `https://lingumaster.app`. Netlify is configured only by the committed `netlify.toml`; nobody in this repo links, deploys, or buys the domain. Writer copy lives only in `src/content/fr.ts`, taken verbatim from `copy/copy-new-v1.md`. While `COPY_STATUS` is not `approved`, every page shows a BROUILLON ribbon. Legal pages are parked (Gor, 24 Oct 20:50 WITA).

Screen slots are `hero-reader`, `shot-library` and `shot-reader`. The cleaned masters are in `src/assets/screens/masters/`. While `src/assets/screens/CAPTURES.md` marks a row provisional, the build shows that capture with `data-provisional="true"`. A missing master still renders a labelled placeholder with `data-placeholder="true"`. `COPY_D16` is `v2-opt1`. There is no price on the page. The App Store badge is Apple's official French black SVG at `assets/badge-fr-black-official.svg`. The build checks that file against `assets/badge-fr-black-official.svg.sha256` and copies it to `public/assets/`. Static badge links use `ct=landing_direct`. An inline script switches them to `ct=tiktok_bio` only when `?src=tiktok_bio`. `config.finalCta` stays `"badge"`; `"text"` replaces the final badge with the same URL on the label.

Inter is one self-hosted variable file in `public/fonts/` (wght 400–600, opsz 14–32). That file is the only font preload. The Next.js runtime scripts start 150 ms after parse, so the font and the CSS are not queued behind the framework download. Counts go through `src/lib/analytics`. The default adapter is `noop` (no request, no cookie, no storage) whenever the production variables are unset, including local builds and Netlify previews. Gor chose Umami Cloud Hobby, cookieless: `NEXT_PUBLIC_ANALYTICS=umami` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` are set by Gor or his brother in the Netlify production context only. They are not committed. Example website id (public): `50533390-5f46-4f32-b670-f4a9db0627ca`. With both values valid, the root layout emits one deferred `https://cloud.umami.is/script.js` tag, `data-domains="lingumaster.app"`, `data-auto-pageview="false"`. `NEXT_PUBLIC_ANALYTICS=debug` still logs the allowlisted payload and beacons it to `NEXT_PUBLIC_ANALYTICS_ENDPOINT` when that is set. `scripts/mock-collector.mjs` is the local receiver. `counter` and `plausible` are not built. Monday reports: `docs/umami-dashboard.md`.
