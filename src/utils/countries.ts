// ISO 3166-1 alpha-2 regions with English names, built from the platform's
// Intl data (no hand-maintained list). Pseudo-regions are skipped.
const EXCLUDED = new Set([
  "AC", "CP", "DG", "EA", "EU", "EZ", "IC", "QO", "TA", "UN", "XA", "XB", "ZZ",
]);

const names = new Intl.DisplayNames(["en"], { type: "region" });

export const COUNTRIES: { code: string; name: string }[] = (() => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const list: { code: string; name: string }[] = [];
  for (const a of letters) {
    for (const b of letters) {
      const code = a + b;
      if (EXCLUDED.has(code)) continue;
      let name: string | undefined;
      try {
        name = names.of(code);
      } catch {
        continue;
      }
      if (name && name !== code) list.push({ code, name });
    }
  }
  return list.sort((x, y) => x.name.localeCompare(y.name, "en"));
})();

export function countryName(code: string | undefined | null): string {
  if (!code) return "";
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
