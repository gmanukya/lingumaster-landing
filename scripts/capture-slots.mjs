/**
 * The three launch slots. Cleaned masters only.
 * Raw shot1–shot9-library and the unused shot3-clean file never ship.
 */
export const FRAME = { width: 1290, height: 2796 };
export const BAND_SOURCE_ROWS = 150;
export const BAND_TOLERANCE = 3;

export const SLOTS = [
  {
    name: "hero-reader",
    raw: "shot6.png",
    master: "shot6-clean.png",
    sha256: "96d530d7acffd9eb844fd112cb56138ad9c855cc15038e5602554bfd401f183d",
    widths: [480, 720, 960],
    sizes: "(min-width:1024px) 326px, 232px",
    priority: true,
  },
  {
    name: "shot-library",
    raw: "shot9-library.png",
    master: "shot9-library-clean.png",
    sha256: "8ad4cbaf3c6e6a7f6800a3c52fbed60ba90a5072d235c1a4f3c983a03101f120",
    widths: [320, 480, 640, 900],
    sizes: "(min-width:1024px) 296px, 151px",
    priority: false,
  },
  {
    name: "shot-reader",
    raw: "shot7.png",
    master: "shot7-clean.png",
    sha256: "74102864471658b3a438682bd27eba0f64f29eb9f6d9ef3a0ea2291122f86574",
    widths: [320, 480, 640, 900],
    sizes: "(min-width:1024px) 296px, 151px",
    priority: false,
  },
];

/** sha256 denylist: raw captures, plus the unused cleaned Today screen. */
export const RAW_HASHES = {
  shot1: "fd420f15db7158cd25329cc659c7a03f6759de5ceb5327ccac5623960ed28ac3",
  shot2: "257df4b0fff3d4c266426c20f71d71097cb86959d584cd0fda5b3ca2dbbd7e35",
  shot3: "994bb44b80b56aa12dfb755647e0f3f7e2de895633cc87127881e913bb75a39f",
  shot4: "f16071d68c7829e641757fb307b23ee1ff535e31a02d85be93ce01c9e962b04d",
  shot5: "0c0ca83595534377855e11eba34b63b18df15ee6ea2486b7b00dbb8790a740e9",
  shot6: "d3bcb41966418c9c0b46a05c88caba6331932d614b5a986826eb270a61dc5b92",
  shot7: "860092799fbbd22636fcc5f073686ad5a0ac40d429ad8e4e7ab6086e41fa43e8",
  shot8: "1459de06b49ce556b9b5b876b8e591c4e887986e54014d2b16ab478a849fc8ab",
  "shot9-library": "7a8fe208291d7eddbd08987aad786359928011b8ccb9a5b63c6081da0fd1ef20",
  "shot3-clean": "eafac7bc697b9862d52eb04f115fbd698b8097a5f92299b861ffe52aef504521",
};

export const RAW_FILENAMES = [
  "shot1.png",
  "shot2.png",
  "shot3.png",
  "shot4.png",
  "shot5.png",
  "shot6.png",
  "shot7.png",
  "shot8.png",
  "shot9-library.png",
  "shot3-clean.png",
  "shot5-clean.png",
];

/** Retired slot names. They must not come back as a screen id. */
export const RETIRED_SLOTS = ["shot-today", "hero-library"];

export const COPY_D16_VALUE = "v2-opt1";

export const VERIFIED_LANGUAGE_WORDS = [
  "english",
  "spanish",
  "portuguese",
  "french",
  "german",
  "italian",
  "anglais",
  "espagnol",
  "portugais",
  "français",
  "française",
  "francais",
  "francaise",
  "allemand",
  "italien",
  "italienne",
];

export function slotByName(name) {
  return SLOTS.find((slot) => slot.name === name) ?? null;
}

export function parseCaptures(markdown) {
  const rows = [];
  for (const line of markdown.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
    if (!cells[0] || cells[0] === "Slot" || /^-+$/.test(cells[0])) continue;
    rows.push({
      slot: cells[0] ?? "",
      raw: cells[1] ?? "",
      master: cells[2] ?? "",
      sha256: cells[3] ?? "",
      statusBar: cells[4] ?? "",
      provisional: (cells[5] ?? "").toLowerCase(),
      designer: cells[6] ?? "",
      gor: cells[7] ?? "",
    });
  }
  return rows;
}
