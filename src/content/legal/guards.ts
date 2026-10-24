/**
 * Needle for unfinished legal copy.
 * Escaped so this file is not itself an unfinished marker.
 */
const INCOMPLETE_MARKER = "[\u00c0 COMPL\u00c9TER";

/** Launch guards for the legal pages. Independent of COPY_STATUS. */
export class LegalGuards {
  static readonly marker = INCOMPLETE_MARKER;

  static incomplete(parts: readonly string[]): boolean {
    return parts.some((part) => part.includes(LegalGuards.marker));
  }

  static robots(parts: readonly string[]): "noindex" | null {
    return LegalGuards.incomplete(parts) ? "noindex" : null;
  }

  static robotsMeta(parts: readonly string[]): string {
    const directive = LegalGuards.robots(parts);
    if (!directive) return "";
    return `<meta name="robots" content="${directive}">`;
  }
}
