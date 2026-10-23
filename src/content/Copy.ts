import { COPY_STATUS, copy } from "./fr";

export class Copy {
  static status(): typeof COPY_STATUS {
    return COPY_STATUS;
  }

  static isDraft(): boolean {
    return COPY_STATUS !== "approved";
  }

  static present(slot: string): boolean {
    const value = Copy.#read(slot);
    return typeof value === "string" && value.length > 0;
  }

  static text(slot: string): string {
    const value = Copy.#read(slot);
    if (typeof value !== "string" || value.length === 0) {
      return `[copy: ${slot}]`;
    }
    return value;
  }

  static #read(slot: string): string | undefined {
    const indexed = /^([A-Za-z]+)\[(\d+)\]\.([A-Za-z]+)$/.exec(slot);
    if (indexed) {
      const key = indexed[1] as keyof typeof copy;
      const field = indexed[3];
      const list = copy[key];
      if (!Array.isArray(list)) return undefined;
      const item = list[Number(indexed[2])] as Record<string, string> | undefined;
      return item?.[field];
    }

    const dotted = /^([A-Za-z]+)\.([A-Za-z]+)$/.exec(slot);
    if (dotted) {
      const key = dotted[1] as keyof typeof copy;
      const field = dotted[2];
      const group = copy[key];
      if (!group || typeof group !== "object" || Array.isArray(group)) return undefined;
      return (group as Record<string, string>)[field];
    }

    const value = (copy as Record<string, unknown>)[slot];
    return typeof value === "string" ? value : undefined;
  }
}
