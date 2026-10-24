import { readFile } from "node:fs/promises";
import path from "node:path";

// Where lead records live. The MVP adapter reads leads/<slug>.json; a database
// adapter (Phase 5) implements the same interface. Callers validate the slug first.
export interface LeadStore {
  /** The raw record for `slug`, or null when there is none. */
  get(slug: string): Promise<unknown | null>;
}

export function jsonLeadStore(dir = path.join(process.cwd(), "leads")): LeadStore {
  return {
    async get(slug) {
      try {
        return JSON.parse(await readFile(path.join(dir, `${slug}.json`), "utf8"));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw err;
      }
    },
  };
}
