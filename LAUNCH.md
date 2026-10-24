# Launch checklist

Human steps only. Agents do not buy the domain, touch Netlify, change DNS, deploy, or tick these boxes. Nothing below is done.

The build can be checked locally. `npm run check:launch` stays red until every gate in task (e) item 6 is true: real captures, legal markers gone, contact acknowledged, and the OG image replaced. Approved copy does not make the page launchable.

The 404 page still renders `[copy: notFound.title]` and `[copy: notFound.body]`. Those slots are not in the approved copy. The Writer supplies them. The gate fails on that HTML until then.

## 0. Captures (D13, Gor or his brother)

- [ ] Capture 3 fresh 2.0.x screens on an iPhone or the iOS Simulator, at 1290 × 2796, with a clean status bar and no marketing text.
  - Hero: library (`hero-library`)
  - Capture 1: library (`shot-library`)
  - Capture 2: reader (`shot-reader`)
- [ ] No AI or correction UI. No `live3` / `ss3`.
- [ ] The Writer re-checks the alt texts against the real screens.
- [ ] The Designer replaces the temporary wordmark OG image (`public/og.png`, 1200 × 630) and drops the `placeholder` / `check:launch` mark.
- [ ] Date and person:

The box cannot run iOS. Gor said on 24 Oct 2026 at 11:19 WITA that he will provide the captures later.

## 1. Domain and Netlify (D14, Gor or his brother)

Blocked until the domain is bought and the site is connected. The engineer does not do this.

- [ ] Buy `lingumaster.app`. Choose the registrar. Check WHOIS redaction.
- [ ] Add the domain in Netlify, set DNS, enable HTTPS, and make `lingumaster.app` the primary domain.
- [ ] Connect this repo to the Netlify site. `www.lingumaster.app` → `lingumaster.app`, and the default `*.netlify.app` host → the primary domain, are Netlify domain settings, not `netlify.toml`.
- [ ] Merge and deploy.
- [ ] `curl -I https://lingumaster.app/` returns 200 with the `netlify.toml` headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, `Content-Security-Policy`, `Strict-Transport-Security` without `preload`, and `Cache-Control: public, max-age=0, must-revalidate` on the HTML).
- [ ] Paste the curl output:

```
```

- [ ] Date and person:

## 2. Legacy `/privacy` and `/terms` (D14, Gor or his brother)

Do this only after the new legal pages are final (no `[À COMPLÉTER` markers). Until then the old site stays untouched. Nothing on the old site is deleted.

The 301 can only be configured on the old Netlify site (`lingumaster.netlify.app`, repo `Amanukyan/Lingumaster-landing-page`). It is not an engineer task and it is not done from this repo.

- [ ] Either leave the old site live and untouched, or add 301s from `https://lingumaster.netlify.app/privacy` and `/terms` to `https://lingumaster.app/privacy` and `/terms`. A forced rule may be needed because the old pages exist.
- [ ] Run the checks in “Legacy URLs” below and paste the output here.
- [ ] Later, Gor updates the App Store Connect privacy and terms URLs, and the app's `PaywallView` URLs, in the next app release.
- [ ] Date and person:

## 3. TikTok bio

- [ ] Gor sets the TikTok bio link to `https://lingumaster.app/?src=tiktok_bio`.
- [ ] The date is written in `funnel.csv` notes.
- [ ] Date and person:

## 4. Real device

- [ ] On a phone, open the TikTok in-app browser, then the page, then the badge. The App Store opens Lingumaster.
- [ ] Date and person:

## 5. Analytics (D3)

- [ ] Gor chooses the counter, or explicitly launches with `noop`.
- [ ] The adapter switches off `noop` only for that choice. The first counts are visible within 24 h.
- [ ] Date and person:

## 6. Baseline

- [ ] The Revenue Lead starts the Monday `funnel.csv` rows. The 14-day baseline starts.
- [ ] Date and person:

## Legacy URLs (acceptance criterion 10)

Run these only after step 2, and only once the new legal text is final. Paste the output under step 2. The old-site step is not ticked until this output is pasted.

```bash
curl -sI https://lingumaster.netlify.app/privacy
curl -sI https://lingumaster.netlify.app/terms
curl -sIL https://lingumaster.netlify.app/privacy
curl -sIL https://lingumaster.netlify.app/terms
curl -sI https://lingumaster.app/privacy
curl -sI https://lingumaster.app/terms
```

Expected:

- The old `/privacy` and `/terms` each return either `200` (old site left untouched) or `301` with `location: https://lingumaster.app/privacy` or `/terms`.
- `curl -sIL` on both ends at `200` on the final page (old or new).
- `https://lingumaster.app/privacy` and `/terms` return `200` (at most one `301` to a trailing-slash form; the final status is 200).

## Contact before launch (D12)

`check:launch` fails while `contactHref` is empty unless `ACCEPT_NO_CONTACT=true` is set for the launch build and `SiteConfig.acceptNoContact` names who accepted it and when. The rights and publisher-address sections still cannot contain `[À COMPLÉTER`.

## JavaScript budget

Measured on the production export of `/`, gzip level 6, modern browsers (`noModule` chunk excluded):

- App Router runtime: 143,840 bytes gzip
- Campaign `ct` script: 378 bytes gzip
- `runtime-defer.js`: 290 bytes gzip
- Together: 144,508 bytes gzip

The two framework chunks alone are 71,969 and 46,638 bytes gzip (118,607 bytes). That is already over the 100 KB budget, before the page's own code. The deferred loader keeps those scripts off the first paint. Lighthouse mobile on this build still reports Performance 100, LCP 1.4 s, CLS 0, TBT 23 ms.

Replacing the runtime with a plain HTML page (design brief §7) is the fallback if the budget has to be met. That change is not in this branch: it would drop hydration of the measurement adapter.
