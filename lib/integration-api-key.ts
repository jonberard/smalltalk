import "server-only";

import { createHash, randomBytes } from "node:crypto";

const API_KEY_PREFIX = "st";

export function generateIntegrationApiKey() {
  return `${API_KEY_PREFIX}_${randomBytes(32).toString("hex")}`;
}

export function hashIntegrationApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function getIntegrationApiKeyLastFour(apiKey: string) {
  return apiKey.slice(-4);
}
