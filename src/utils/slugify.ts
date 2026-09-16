/**
 * Converts an arbitrary string into a URL-safe slug: lowercase words joined
 * by single hyphens, with diacritics and punctuation stripped. Callers are
 * responsible for ensuring uniqueness against the database.
 */
export const slugify = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
