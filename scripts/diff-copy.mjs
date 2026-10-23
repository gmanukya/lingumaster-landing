import fs from "node:fs";
import path from "node:path";

const SLOT_ORDER = {
  Header: ["wordmark"],
  Hero: ["hero.headline", "hero.subline"],
  Badge: ["badge.ariaLabel"],
  "3 bénéfices": [
    "benefits[0].title",
    "benefits[0].line",
    "benefits[1].title",
    "benefits[1].line",
    "benefits[2].title",
    "benefits[2].line",
  ],
  "Titres masqués": ["headings.benefits", "headings.captures"],
  "Légendes des captures": [
    "captures[0].caption",
    "captures[1].caption",
    "captures[1].variant",
  ],
  "Alt text des écrans": ["hero.imageAlt", "captures[0].alt", "captures[1].alt"],
  "Ligne de confiance (optionnelle)": ["trust.line"],
  "CTA final": ["finalCta.headline", "finalCta.label"],
  Footer: [
    "footer.privacy",
    "footer.terms",
    "footer.legal",
    "footer.contact",
    "legal.appleCredit",
  ],
  "Meta / partage": [
    "meta.title",
    "meta.description",
    "meta.ogTitle",
    "meta.ogDescription",
  ],
};

export class CopyDiff {
  static root = process.cwd();

  static fromMarkdown() {
    const file = path.join(CopyDiff.root, "copy", "copy-new-v1.md");
    const sections = new Map();
    let current = null;
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (line.startsWith("## ")) {
        current = line.slice(3).trim();
        sections.set(current, []);
        continue;
      }
      if (!current || !line.startsWith("|") || /^\|\s*-+/.test(line)) continue;
      const cells = line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());
      if (!cells[0] || cells[0] === "Slot") continue;
      sections.get(current).push(cells[1]);
    }

    const expected = new Map();
    for (const [section, slots] of Object.entries(SLOT_ORDER)) {
      const values = sections.get(section);
      if (!values) throw new Error(`missing section ${section}`);
      if (values.length !== slots.length) {
        throw new Error(`${section}: ${values.length} values, ${slots.length} slots`);
      }
      slots.forEach((slot, index) => expected.set(slot, values[index]));
    }
    return expected;
  }

  static fromSource() {
    const file = path.join(CopyDiff.root, "src", "content", "fr.ts");
    const source = fs.readFileSync(file, "utf8");
    const status = source.match(/COPY_STATUS(?:\s*:\s*[^=]+)?=\s*"([^"]+)"/);
    if (!status || status[1] !== "draft:copy-new-v1") {
      throw new Error(`COPY_STATUS is ${status ? status[1] : "missing"}`);
    }
    const body = source.match(/export const copy = (\{[\s\S]*\}) as const;/);
    if (!body) throw new Error("copy object not found in fr.ts");
    const copy = Function(`"use strict"; return (${body[1]});`)();
    const actual = new Map();
    CopyDiff.flatten(copy, "", actual);
    return actual;
  }

  static flatten(value, prefix, out) {
    if (typeof value === "string") {
      out.set(prefix, value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => CopyDiff.flatten(item, `${prefix}[${index}]`, out));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      CopyDiff.flatten(child, next, out);
    }
  }

  static codes(value) {
    return [...value]
      .filter((char) => char.charCodeAt(0) > 127)
      .map((char) => `U+${char.charCodeAt(0).toString(16).toUpperCase()}`)
      .join(" ");
  }

  static run() {
    const expected = CopyDiff.fromMarkdown();
    const actual = CopyDiff.fromSource();
    const diffs = [];
    const keys = new Set([...expected.keys(), ...actual.keys()]);
    for (const key of keys) {
      const left = expected.get(key);
      const right = actual.get(key);
      if (left === undefined) diffs.push(`extra in fr.ts: ${key}`);
      else if (right === undefined) diffs.push(`missing from fr.ts: ${key}`);
      else if (left !== right) {
        diffs.push(
          `mismatch ${key}\n  md ${JSON.stringify(left)} ${CopyDiff.codes(left)}\n  ts ${JSON.stringify(right)} ${CopyDiff.codes(right)}`,
        );
      }
    }
    if (diffs.length > 0) {
      console.error(diffs.join("\n"));
      console.error(`copy diff: ${diffs.length} differences`);
      process.exit(1);
    }
    console.log(`copy diff: 0 differences (${expected.size} slots)`);
  }
}

CopyDiff.run();
