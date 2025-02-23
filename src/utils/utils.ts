export function throttle(func: Function, limit: number) {
  let inThrottle: boolean;

  return function () {
    const args = arguments;
    // @ts-ignore
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export const normalizeBreadcrumbs = (url: string): string[] =>
  url
    .split("/")
    .filter((item) => item && item !== "/")
    .map((item) => (item.includes("-") ? item.split("-").join(" ") : item));
