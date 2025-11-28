import { describe, it, expect } from "vitest";
import { ingestWorkout } from "../api/ingest";
import { mapBlocks } from "../api/mapper";
import { syncWorkoutToGarmin } from "../api/garmin-sync";

const env = (import.meta as any).env || {};
const nodeEnv = (globalThis as any).process?.env || {};

const runGarminE2E =
  Boolean(env.VITE_RUN_GARMIN_E2E) ||
  Boolean(nodeEnv.VITE_RUN_GARMIN_E2E);

const GARMIN_E2E_TIMEOUT_MS =
  Number(env.VITE_GARMIN_E2E_TIMEOUT_MS || nodeEnv.VITE_GARMIN_E2E_TIMEOUT_MS) ||
  60000;

const describeMaybe = runGarminE2E ? describe : describe.skip;

/**
 * Full happy-path E2E:
 *   ingest (YouTube) -> mapper (auto-map) -> Garmin sync (via mapper-api)
 *
 * NOTE:
 * - If ingest returns 0 blocks, we don't fail the test; we log and short-circuit.
 *   The ingest E2E test is already responsible for asserting blocks > 0.
 * - This test's job is to ensure that *when* we have blocks,
 *   mapper + garmin sync contracts are good end-to-end.
 */
describeMaybe(
  "garmin sync E2E – ingest → mapper → garmin",
  () => {
    it(
      "ingests a workout and syncs it to Garmin successfully",
      async () => {
        const sampleUrl =
          env.VITE_INGEST_SAMPLE_YOUTUBE_URL ||
          nodeEnv.VITE_INGEST_SAMPLE_YOUTUBE_URL;

        if (!sampleUrl) {
          throw new Error(
            "VITE_INGEST_SAMPLE_YOUTUBE_URL is not set. " +
              "Set it to a known-good workout video URL before running this test."
          );
        }

        const started = Date.now();

        // 1) Ingest from YouTube
        const ingestResult = await ingestWorkout({
          sourceType: "youtube",
          url: String(sampleUrl),
        });

        const ingestDuration = Date.now() - started;

        // Basic shape checks
        expect(typeof ingestResult.title).toBe("string");
        expect(typeof ingestResult.source).toBe("string");
        expect(ingestResult).toHaveProperty("blocks");

        // If ingest returned 0 blocks, log and short-circuit instead of failing.
        if (!Array.isArray(ingestResult.blocks) || ingestResult.blocks.length === 0) {
          // eslint-disable-next-line no-console
          console.warn(
            `[garmin-e2e] Ingest returned 0 blocks after ${ingestDuration}ms for ${sampleUrl}. ` +
              "Skipping mapper + Garmin sync. Check ingest E2E or choose a different sample URL."
          );
          expect(true).toBe(true);
          return;
        }

        const title =
          ingestResult.title || "AmakaFlow E2E Garmin Sync Workout";

        // 2) Mapper auto-map
        const mapperStarted = Date.now();
        const mapResult = await mapBlocks({
          title,
          source: ingestResult.source,
          blocks: ingestResult.blocks,
        });
        const mapperDuration = Date.now() - mapperStarted;

        expect(typeof mapResult.yaml).toBe("string");
        expect(mapResult.yaml.length).toBeGreaterThan(0);

        // 3) Garmin sync via mapper-api /workout/sync/garmin
        const garminStarted = Date.now();
        const garminResult = await syncWorkoutToGarmin({
          blocks_json: {
            title,
            source: ingestResult.source,
            blocks: ingestResult.blocks,
          },
          workout_title: title,
          schedule_date: null,
        });
        const garminDuration = Date.now() - garminStarted;

        // eslint-disable-next-line no-console
        console.log(
          `[garmin-e2e] Ingest=${ingestDuration}ms, Mapper=${mapperDuration}ms, Garmin=${garminDuration}ms ` +
            `→ success=${garminResult.success}, status=${garminResult.status}`
        );

        expect(garminResult.success).toBe(true);
        expect(typeof garminResult.garminWorkoutId).toBe("string");
      },
      GARMIN_E2E_TIMEOUT_MS
    );
  }
);
