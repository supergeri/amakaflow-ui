import type { IngestResponse } from "./ingest";

const env = (import.meta as any).env || {};
const nodeEnv = (globalThis as any).process?.env || {};

/**
 * Mapper base URL – we go through mapper-api for Garmin sync.
 * (mapper-api internally calls garmin-sync-api with your credentials.)
 */
function getMapperBaseUrlForGarmin(): string {
  const raw =
    (env.VITE_MAPPER_API_URL as string | undefined) ||
    (nodeEnv.VITE_MAPPER_API_URL as string | undefined);

  if (!raw) {
    throw new Error(
      "VITE_MAPPER_API_URL is not configured. " +
        "Set it in your .env or export before running Garmin E2E tests."
    );
  }

  return raw.replace(/\/$/, "");
}

/**
 * Timeout for the client call to mapper-api /workout/sync/garmin.
 *
 * - Controlled by VITE_GARMIN_CLIENT_TIMEOUT_MS
 * - If value <= 0 → no timeout (no AbortController)
 * - Default: 60000ms (60s)
 */
function getGarminClientTimeoutMs(): number {
  const raw =
    env.VITE_GARMIN_CLIENT_TIMEOUT_MS ||
    nodeEnv.VITE_GARMIN_CLIENT_TIMEOUT_MS ||
    "";

  const n = Number(raw);
  if (Number.isFinite(n)) {
    return n; // allow 0 or negative to mean "no timeout"
  }

  return 60000;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs, ...rest } = init;
  const ms = timeoutMs ?? getGarminClientTimeoutMs();

  // If ms <= 0, skip AbortController (no timeout)
  if (typeof AbortController === "undefined" || ms <= 0) {
    return fetch(input, rest);
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(input, {
      ...rest,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(id);
  }
}

export interface GarminSyncRequest {
  blocks_json: {
    title: string;
    source?: string;
    blocks: IngestResponse["blocks"];
    [key: string]: unknown;
  };
  workout_title?: string;
  schedule_date?: string | null;
}

export interface GarminSyncResponse {
  success: boolean;
  status?: string;
  message?: string;
  garminWorkoutId?: string;
  [key: string]: unknown;
}

/**
 * High-level client for:
 *   POST mapper-api:8001/workout/sync/garmin
 */
export async function syncWorkoutToGarmin(
  payload: GarminSyncRequest
): Promise<GarminSyncResponse> {
  const baseUrl = getMapperBaseUrlForGarmin();

  const res = await fetchWithTimeout(
    `${baseUrl.replace(/\/$/, "")}/workout/sync/garmin`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Garmin sync failed: ${res.status} ${res.statusText}${
        text ? ` – ${text}` : ""
      }`
    );
  }

  return (await res.json()) as GarminSyncResponse;
}
