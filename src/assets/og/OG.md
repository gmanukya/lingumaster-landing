# OG image

Designer final, 24 Oct 2026. PNG 1200×630. The build copies these bytes to `public/og.png`. The static export serves them as `out/og.png`. The page URL stays `https://lingumaster.app/og.png`. Nothing resizes or re-encodes the file.

| File | sha256 | Pixels | check:launch |
|---|---|---|---|
| og-1200x630.png | 69a74e43310f5346b0ccbeb100a3224ac8ce27931c62838596e0124f305e08ab | 1200×630 | passes |

The temporary wordmark still fails the gate. Its `tEXt` marker is `placeholder` / `check:launch`, and its sha256 is `8815fccb0cfd3478a7731b3854defb58da9a2c691e51816a031751f8776e4cbc`. Any other sha256 fails the gate as well.
