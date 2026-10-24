/** Keeps the last words of a headline on one line. The words come from the copy string. */
export class Headline {
  static split(text: string, words = 3): { head: string; tail: string | null } {
    const parts = text.split(" ");
    if (parts.length <= words) return { head: text, tail: null };
    return {
      head: parts.slice(0, -words).join(" "),
      tail: parts.slice(-words).join(" "),
    };
  }
}
