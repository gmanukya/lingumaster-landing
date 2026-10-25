# Umami dashboard reports

Umami Cloud Hobby, cookieless. One website, `lingumaster.app`. The Website ID is public. The example already created for this site is `50533390-5f46-4f32-b670-f4a9db0627ca`. Gor or his brother puts that value in the Netlify production environment as `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, with `NEXT_PUBLIC_ANALYTICS=umami`. Neither variable is committed. Previews and local builds send nothing.

These reports do not exist yet. The test event waits until `lingumaster.app` is live and the production build has both variables. This file is the click path. It is not a screenshot of data.

The Hobby plan includes custom events, event properties, funnels, breakdown, and export. It does not include API access, email reports, or team seats. Retention on Hobby is 6 months, so the Monday row in `funnel.csv` is the long-term record. The exact filter labels in the Umami UI were not verified when this was written. On the first login, confirm the names below. If a URL filter cannot match `?src=`, use the fallback at the bottom.

## 1. Views by `src`

1. Open the website `Lingumaster landing`.
2. Choose the date range (Monday report: the last 7 days).
3. Open the pages or pageviews report.
4. Filter the URL or path so it contains `src=tiktok_bio`. That count is views from the TikTok bio.
5. The remaining pageviews, URL `/` with no `src=tiktok_bio`, are `landing_direct`.

The page sends one pageview per load. `/?src=tiktok_bio` is stored only for the normalised value `tiktok_bio`. Any other `src` is stored as `/` and counted as `landing_direct`.

## 2. Badge taps by `src`

1. Open Events (or the custom-event report).
2. Select the event `badge_tap`.
3. Break down by the property `src`. The values are `tiktok_bio` and `landing_direct`.
4. Break down again by the property `placement`. The values are `hero` and `final`.

`badge_tap` is sent with only those two properties.

## 3. Funnel « visit → tap »

1. Open Funnels and create one named `visit → tap`.
2. Step 1: page `/`.
3. Step 2: event `badge_tap`.
4. Window: 7 days.
5. Split or break down by `src` if the funnel offers it.

Hobby includes the funnel report. The funnel ratio is the same number as taps ÷ views for the total.

## 4. Tap rate by `src`

Each Monday, from reports 1 and 2:

`tap rate(src) = badge_tap(src) ÷ views(src)`

Read `tiktok_bio` first. Copy the row into `/workspace/lingumaster/revenue/funnel.csv`. The iteration trigger in the brief is a `tiktok_bio` rate below 25%.

Cross-check the same week with App Store Connect (campaign `pt=107400811`, broken down by `ct`) and RevenueCat (new customers). The three counts are never joined per person. Expect taps ≥ product-page views ≥ downloads.

Also open Umami → Usage and confirm the month is under 100,000 events. A pageview counts as 1. A `badge_tap` with `src` and `placement` counts as 3. At a 10% tap rate that is about 75,000 visits in the included allowance.

## Fallback if the URL filter is missing

If the UI cannot filter pageviews by `?src=`:

- Taps by `src` still come from the `badge_tap` property `src` (report 2).
- Views by `src` are not available. Use the all-views total for the week and say so in the `funnel.csv` note.
- The funnel still gives the overall visit → tap ratio.

## Access

Hobby has no team seats and no API. If the website settings offer a share link, Gor sends it to the Revenue Lead. Otherwise Gor sends the Monday screenshot or the CSV export.

## Test event

After the domain serves this build: open `https://lingumaster.app/?src=tiktok_bio`, then tap the hero badge. Realtime should show one pageview at `/?src=tiktok_bio` and one `badge_tap` with `src=tiktok_bio` and `placement=hero` within a minute. A reload is a second pageview. `/?src=evil` is a `landing_direct` pageview (`/`). Then set `SiteConfig.analytics.testEventSeen` to `{ by, at }`. Resetting the test rows afterwards is in the website settings if Umami offers a data reset; confirm that control on the day.
