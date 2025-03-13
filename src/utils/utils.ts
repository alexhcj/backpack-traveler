import { ECountryShortcut, type TCountryShortcutKeys } from "../types/country";

/**
 * Creates a throttled function that only invokes the provided function at most once
 * within the specified interval.
 *
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastFunc: ReturnType<typeof setTimeout> | undefined;
  let lastRan: number = 0;

  return function (this: any, ...args: Parameters<T>): void {
    const context = this;

    if (!inThrottle) {
      // If not in throttle period, execute immediately
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      // Otherwise, schedule execution after the throttle period
      clearTimeout(lastFunc);

      lastFunc = setTimeout(
        function () {
          if (Date.now() - lastRan >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - lastRan),
      );
    }
  };
}

export const normalizeBreadcrumbs = (url: string): string[] =>
  url
    .split("/")
    .filter((item) => item && item !== "/")
    .map((item) => (item.includes("-") ? item.split("-").join(" ") : item));

export const normalizeStrToUpperSnace = (str: string) => {
  return str.toUpperCase().replace(" ", "_");
};

export const convertISODate = (date: Date, type = "digit", locale = "en") => {
  const convertedDate = new Date(date);
  const year = convertedDate.getFullYear();
  const month = convertedDate.toLocaleString(locale || "default", {
    month: "long",
  });
  const day = convertedDate.getDate();

  return `${month} ${day}, ${year}`;
};

export const getCountryShortcut = (country: string): string => {
  const countryKey = normalizeStrToUpperSnace(country) as TCountryShortcutKeys;

  return ECountryShortcut[countryKey] ?? country;
};
