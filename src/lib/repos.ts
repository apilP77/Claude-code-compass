import reposFile from "../../data/repos.json";
import { repositoriesFileSchema, type Repository } from "./schema";

/**
 * Why this module throws at build time, on purpose
 * -------------------------------------------------
 * `data/repos.json` is the product. A malformed record is not a cosmetic
 * bug: a bad `id` silently breaks deduplication, a missing `url` sends
 * readers to the wrong project, and a `reviewed` badge without a date is a
 * false claim about someone else's code.
 *
 * So this module validates the whole file the moment it is imported and
 * throws if anything is wrong. Every page imports it, which means
 * `next build` fails and CI goes red before a broken listing can be
 * deployed. The alternative — parsing lazily, or falling back to defaults —
 * would let bad data reach readers while the build stayed green, and the
 * failure would surface later as a support report instead of a stack trace
 * on the commit that caused it.
 *
 * The trade-off is deliberate: adding or changing a field means editing
 * `src/lib/schema.ts` first. That is cheaper than debugging silently
 * discarded data.
 *
 * The JSON is imported rather than read with `fs` so the bundler can inline
 * it and the same module works wherever it is rendered.
 */

const raw = reposFile as unknown as {
  repositories?: Array<{ id?: unknown }>;
};

const parsed = repositoriesFileSchema.safeParse(reposFile);

if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => {
    const [section, index, ...rest] = issue.path;
    const field = rest.length > 0 ? rest.join(".") : "(record)";

    // Name the offending repository, not just its array index. An index is
    // useless once someone reorders the file.
    if (section === "repositories" && typeof index === "number") {
      const candidate = raw.repositories?.[index];
      const id =
        typeof candidate?.id === "string"
          ? candidate.id
          : `repositories[${index}]`;
      return `  - ${id} → ${field}: ${issue.message}`;
    }

    return `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`;
  });

  throw new Error(
    [
      "data/repos.json does not match src/lib/schema.ts.",
      `${parsed.error.issues.length} problem(s) found:`,
      ...problems,
      "",
      "Fix the data. If the shape is genuinely wrong, change src/lib/schema.ts first.",
      "This throws on purpose — see the comment at the top of src/lib/repos.ts.",
    ].join("\n"),
  );
}

/**
 * Every repository in the directory, already validated.
 *
 * Read-only: callers sort and filter copies (see `search.ts`) rather than
 * mutating shared module state.
 */
export const repositories: readonly Repository[] = parsed.data.repositories;

export type { Repository };
