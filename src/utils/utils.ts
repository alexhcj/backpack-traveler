import { ECountryShortcut, type TCountryShortcutKeys } from "../types/country";
import type { TDateFormat } from "../types/date";

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

export const normalizeStrToAmpersand = (str: string) => {
  return str.replaceAll("-and-", " & ");
};

export const normalizeStrToSlug = (str: string) => {
  return str.toLowerCase().replace(" ", "-");
};

export const capitalizeStr = (str: string) => {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const convertISODate = (
  date: Date | string,
  type: TDateFormat = "digit",
  locale = "en",
) => {
  const convertedDate = new Date(date);

  const year = convertedDate.getFullYear();
  const month = convertedDate.toLocaleString(locale || "default", {
    month: "long",
  });
  const day = convertedDate.getDate();

  if (type === "month-year") {
    return `${month} ${year}`;
  }

  return `${month} ${day}, ${year}`;
};

export const getCountryShortcut = (country: string): string => {
  const countryKey = normalizeStrToUpperSnace(country) as TCountryShortcutKeys;

  return ECountryShortcut[countryKey] ?? country;
};

export function formatSku(sku: number | string, length = 3): string {
  return String(sku).padStart(length, "0");
}

export function formatPrice(price: number): string {
  return price.toFixed(2);
}

export function convertWeightToKg(weight: number): string {
  return (weight / 1000).toFixed(2);
}

export function convertMmtoCm(value: number): string {
  return (value / 10).toString();
}

export function generateBookSKU(slug: string): string {
  const prefix = slug
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, "X");

  const randomDigits = Math.floor(1000 + Math.random() * 9000);

  return `BK-${prefix}-${randomDigits}`;
}
