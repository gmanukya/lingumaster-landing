export type LegalBlock =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; headers: string[]; rows: string[][] };

/** Small build-time Markdown reader for the legal pages. Headings, lists, tables, paragraphs. */
export class LegalMarkdown {
  static blocks(source: string): LegalBlock[] {
    const lines = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n");
    const blocks: LegalBlock[] = [];
    let index = 0;
    while (index < lines.length) {
      const line = lines[index] ?? "";
      if (line.trim() === "") {
        index += 1;
        continue;
      }
      const heading = /^(#{1,3}) (.+)$/.exec(line);
      if (heading?.[1] && heading[2]) {
        const level = heading[1].length as 1 | 2 | 3;
        blocks.push({ kind: "heading", level, text: heading[2].trim() });
        index += 1;
        continue;
      }
      if (line.startsWith("|")) {
        const table: string[] = [];
        while (index < lines.length && (lines[index] ?? "").startsWith("|")) {
          table.push(lines[index] ?? "");
          index += 1;
        }
        blocks.push(LegalMarkdown.#table(table));
        continue;
      }
      if (line.startsWith("- ")) {
        const items: string[] = [];
        while (index < lines.length && (lines[index] ?? "").startsWith("- ")) {
          items.push((lines[index] ?? "").slice(2).trim());
          index += 1;
        }
        blocks.push({ kind: "list", items });
        continue;
      }
      const paragraph: string[] = [];
      while (index < lines.length) {
        const current = lines[index] ?? "";
        if (
          current.trim() === "" ||
          current.startsWith("#") ||
          current.startsWith("|") ||
          current.startsWith("- ")
        ) {
          break;
        }
        paragraph.push(current.trim());
        index += 1;
      }
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
    }
    return blocks;
  }

  static #cells(line: string): string[] {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  static #table(lines: string[]): LegalBlock {
    const rows = lines
      .map((line) => LegalMarkdown.#cells(line))
      .filter((cells) => !cells.every((cell) => /^:?-+:?$/.test(cell)));
    const headers = rows[0] ?? [];
    const body = rows.slice(1).map((row) => {
      const padded = headers.map((_, cell) => row[cell] ?? "");
      return padded;
    });
    return { kind: "table", headers, rows: body };
  }
}
