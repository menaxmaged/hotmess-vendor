import i18n from "@/lib/i18n";

/**
 * Backend CMS rows carry an Arabic twin next to each display field
 * (`label`/`labelAr`, `name`/`nameAr`, `description`/`descriptionAr`). Picks
 * the Arabic one while the app is in Arabic and it's non-empty, else English.
 */
export function pickLocalized<T extends object>(row: T | null | undefined, field: keyof T & string): string {
  if (!row) return "";
  const record = row as Record<string, unknown>;
  const english = typeof record[field] === "string" ? (record[field] as string) : "";
  if (i18n.language !== "ar") return english;
  const arabic = record[`${field}Ar`];
  return typeof arabic === "string" && arabic.trim() ? arabic : english;
}

/** Same idea for rows that spell out both languages (`nameEn`/`nameAr`, `labelEn`/`labelAr`, …). */
export function pickBilingual(row: object | null | undefined, base: string): string {
  if (!row) return "";
  const record = row as Record<string, unknown>;
  const english = typeof record[`${base}En`] === "string" ? (record[`${base}En`] as string) : "";
  const arabic = record[`${base}Ar`];
  return i18n.language === "ar" && typeof arabic === "string" && arabic.trim() ? arabic : english;
}
