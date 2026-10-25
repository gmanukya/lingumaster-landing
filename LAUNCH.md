# Launch checklist

Human steps only. Agents do not buy the domain, touch Netlify, change DNS, deploy, or tick these boxes. Nothing below is done.

The build can be checked locally. `npm run check:launch` stays red until every gate in task (e) item 6 is true. Approved copy does not make the page launchable. The three cleaned captures are in the build and still provisional: `CAPTURES.md` has no Designer sign-off and no Gor approval, so each image carries `data-provisional="true"`. The OG image is the Designer file `src/assets/og/og-1200x630.png` (sha256 `69a74e43310f5346b0ccbeb100a3224ac8ce27931c62838596e0124f305e08ab`). The wordmark placeholder still fails `check:launch`.

The 404 page uses the French copy Gor approved on 24 Oct 2026, 23:11 WITA (`notFound.title`, `notFound.body`, `notFound.cta`). Designer sign-off on PR #7 was FIX, four layout items, applied on this branch: the block is centred (`min-height: 100svh`, `padding-bottom: 12svh`), the wordmark sits in the home header frame as plain text (not a link), the title uses the home H1 size below 768 and 64/68 from 1024, and the link is 17 px with the underline always on. Exactly one link remains, to `/`.

## 0. Captures (D13 answered, D15 resolved)

Gor supplied the captures on 24 Oct 2026. The three cleaned files are exported. What is left is human:

- [ ] Designer: sign off `shot6-clean.png`, `shot9-library-clean.png` and `shot7-clean.png` in `src/assets/screens/CAPTURES.md` (`provisional: no`, name and date).
- Designer OG, 24 Oct 2026: `src/assets/og/og-1200x630.png` is served as `https://lingumaster.app/og.png`. The temporary wordmark is not.
- [ ] Writer: re-check the alt texts and the Capture 1 caption against the final images.
- [ ] Gor: approve the final three through the CEO. The approval reference goes in `CAPTURES.md`.
- [ ] Date and person:

The box cannot run iOS. The unused Today capture is not exported. Raw captures are not in this repo.

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

## 2. The old Netlify site stays live (Gor, 24 Oct 2026 20:50 WITA)

The old `lingumaster.netlify.app` site stays live untouched for the App Store and paywall links. Nobody touches it: no deletion, no pause, no rename, no redirect, no edit. Nothing to do for it in this launch.

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

## Contact before launch (D12)

`check:launch` fails while `contactHref` is empty unless `ACCEPT_NO_CONTACT=true` is set for the launch build and `SiteConfig.acceptNoContact` names who accepted it and when.

## JavaScript budget

Measured on the production export of `/` after the Designer OG image, gzip level 6, modern browsers (`noModule` chunk excluded):

- App Router runtime: 143,855 bytes gzip
- Campaign `ct` script: 378 bytes gzip
- `runtime-defer.js`: 290 bytes gzip
- Together: 144,523 bytes gzip

The two framework chunks alone are 71,969 and 46,638 bytes gzip (118,607 bytes). That is already over the 100 KB budget, before the page's own code. The deferred loader keeps those scripts off the first paint. Lighthouse mobile on this build reports Performance 100, LCP 1.7 s, CLS 0, TBT 20 ms. The runtime was not changed. A plain HTML page (design brief §7) stays a proposal, not part of this branch.

Replacing the runtime with a plain HTML page (design brief §7) is the fallback if the budget has to be met. That change is not in this branch: it would drop hydration of the measurement adapter.
