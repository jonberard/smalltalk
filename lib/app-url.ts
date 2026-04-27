import "server-only";

const DEFAULT_APP_BASE_URL = "https://usesmalltalk.com";

export function getAppBaseUrl() {
  const value =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_APP_BASE_URL;

  return value.replace(/\/+$/, "");
}

export function getRequestAwareAppBaseUrl(origin?: string | null) {
  const normalizedOrigin = origin?.trim().replace(/\/+$/, "");
  return normalizedOrigin || getAppBaseUrl();
}
