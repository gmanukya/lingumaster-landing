# Captures

Cleaned masters only. The raw `shot1`–`shot9-library` files are not in this repo. The Designer has signed each slot. Each row stays `provisional: yes`, and Gor's approval stays empty, until Gor approves the three. While a row is provisional the build shows the capture with `data-provisional="true"`. `check:launch` fails on any provisional row, any empty Gor approval, or any `data-placeholder`.

Masters: `src/assets/screens/masters/`. Exports and the sha256 sidecars are written next to the images in `public/screens/` (and copied to `out/screens/` by the static export).

| Slot | Raw file | Cleaned master | sha256 | Status bar | Provisional | Designer sign-off | Gor approval |
|---|---|---|---|---|---|---|---|
| hero-reader | shot6.png | shot6-clean.png | 96d530d7acffd9eb844fd112cb56138ad9c855cc15038e5602554bfd401f183d | blank band, rows 0–149 | yes | Designer PASS, 24 Oct 2026, PR #5 fadd7b4: sha256 = master, band blank, uncropped, slot correct | |
| shot-library | shot9-library.png | shot9-library-clean.png | 8ad4cbaf3c6e6a7f6800a3c52fbed60ba90a5072d235c1a4f3c983a03101f120 | blank band, rows 0–149 | yes | Designer PASS, 24 Oct 2026, PR #5 fadd7b4: sha256 = master, band blank, uncropped, slot correct | |
| shot-reader | shot7.png | shot7-clean.png | 74102864471658b3a438682bd27eba0f64f29eb9f6d9ef3a0ea2291122f86574 | blank band, rows 0–149 | yes | Designer PASS, 24 Oct 2026, PR #5 fadd7b4: sha256 = master, band blank, uncropped, slot correct | |
