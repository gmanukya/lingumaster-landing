# Launch checklist

Human steps only. Agents do not buy the domain, touch Netlify, change DNS, deploy, or tick these boxes. Nothing below is done.

The build can be checked locally. `npm run check:launch` stays red. Approved copy does not make the page launchable. The three cleaned captures are in the build. The Designer has signed each row, and each row is still `provisional: yes` with Gor's approval empty, so each image carries `data-provisional="true"`. The OG image is the Designer file `src/assets/og/og-1200x630.png` (sha256 `69a74e43310f5346b0ccbeb100a3224ac8ce27931c62838596e0124f305e08ab`).

On a build with `NEXT_PUBLIC_ANALYTICS` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` unset, `npm run check:launch` reports these 11 problems and nothing else:

- `analytics: production env var missing` — set both in the Netlify production context. They are not committed.
- `analytics: script tag missing from out/index.html` — the same unset build does not emit the tag.
- `analytics: testEventSeen is unset` — `SiteConfig.analytics.testEventSeen` stays null until the live test event.
- `contact: contactHref is unset and ACCEPT_NO_CONTACT is not recorded with who and when`
- `captures: hero-reader provisional: yes`
- `captures: hero-reader Gor approval is empty`
- `captures: shot-library provisional: yes`
- `captures: shot-library Gor approval is empty`
- `captures: shot-reader provisional: yes`
- `captures: shot-reader Gor approval is empty`
- `provisional: out/index.html has data-provisional="true"`

A build made with both variables set clears the env-var line and the script-tag line. `testEventSeen`, the contact line, and the provisional capture lines stay.

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

## 5. Analytics (D3, Umami Cloud Hobby)

Gor chose Umami Cloud, Hobby plan, cookieless. There is no cookie banner. The code default stays `noop`. A production build sends counts only when both variables below are present at build time. They are set in the Netlify **production** context, not in `netlify.toml`, and not on deploy previews or branch deploys. `check:launch` fails until that production build contains them, and until `analytics.testEventSeen` is recorded. An explicit `noop` launch does not pass.

- [ ] Gor or his brother sets, for the Netlify production context only: `NEXT_PUBLIC_ANALYTICS=umami` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` to the website UUID. Example, public, already created: `50533390-5f46-4f32-b670-f4a9db0627ca`. Leave `NEXT_PUBLIC_UMAMI_DOMAINS` unset so the tag stays `data-domains="lingumaster.app"`.
- [ ] After `lingumaster.app` is the live host: one visit to `/?src=tiktok_bio`, one tap on the hero badge, both visible in Umami realtime within a minute (the steps are in `docs/umami-dashboard.md`). Then set `SiteConfig.analytics.testEventSeen` to `{ by, at }` with the person and the ISO date.
- [ ] On each browser the team uses on the live site, run `localStorage.setItem("umami.disabled", "1")` once in the console. That key is read by Umami's script. This site never writes it.
- [ ] Monday tap rate goes into `funnel.csv` from `docs/umami-dashboard.md`.
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

The two framework chunks alone are 71,969 and 46,638 bytes gzip (118,607 bytes). That is already over the 100 KB budget, before the page's own code. The deferred loader keeps those scripts off the first paint. Lighthouse mobile on main reported Performance 100, LCP 1.7 s, CLS 0, TBT 20 ms.

Task (c2) measured the same home-page total on `b806c148` at 144,641 bytes gzip. With the Umami adapter and neither env var set, the total is 144,965 bytes gzip (+324). With both production variables set at build time, the total is 144,782 bytes gzip (+141). The tracker file is not in that total: `https://cloud.umami.is/script.js` is cross-origin and `defer` (4,810 bytes raw, 2,333 bytes gzip on 25 Oct 2026). Lighthouse mobile on that local build, hostname not in `data-domains`, reports Performance 100, LCP 1.7 s, CLS 0, TBT 20 ms. The render-blocking audit still lists the two existing CSS files. The Umami script is not in that list. A plain HTML page (design brief §7) stays a proposal, not part of this branch.

Replacing the runtime with a plain HTML page (design brief §7) is the fallback if the budget has to be met. That change is not in this branch: it would drop hydration of the measurement adapter.
