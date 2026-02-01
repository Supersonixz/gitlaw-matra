export type AppLocale = "th" | "en";

export function pickLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): AppLocale {
  const raw = (acceptLanguage ?? "").toLowerCase();

  // Fast-path: prefer Thai if explicitly present
  if (raw.includes("th")) return "th";

  // Otherwise default to English when any language is present
  if (raw.trim().length > 0) return "en";

  // Build/static export fallback
  return "th";
}

export function getOpenGraphLocale(locale: AppLocale): string {
  return locale === "th" ? "th_TH" : "en_US";
}

export function getAlternateOpenGraphLocale(locale: AppLocale): string[] {
  return [getOpenGraphLocale(locale === "th" ? "en" : "th")];
}

function isProbablyBuddhistEraYear(year: number): boolean {
  // Thai constitutions in this app are stored as พ.ศ. (B.E.) like 2475, 2560.
  // Treat anything >= 2400 as B.E. to avoid mis-converting modern A.D. years.
  return year >= 2400;
}

export function toADYear(year: number): number {
  return isProbablyBuddhistEraYear(year) ? year - 543 : year;
}

export function toBEYear(year: number): number {
  return isProbablyBuddhistEraYear(year) ? year : year + 543;
}

export function formatYearByLocale(
  year: number,
  locale: AppLocale,
  opts?: { includeBoth?: boolean },
): string {
  const ad = toADYear(year);
  const be = toBEYear(year);

  if (locale === "th") {
    if (opts?.includeBoth) return `พ.ศ.${be} (ค.ศ.${ad})`;
    return `พ.ศ.${be}`;
  }

  if (opts?.includeBoth) return `A.D. ${ad} (B.E. ${be})`;
  return `A.D. ${ad}`;
}
