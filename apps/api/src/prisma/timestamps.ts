/**
 * Current timestamp for `timestamptz` columns.
 *
 * Prisma 8's `pg/timestamptz-temporal` codec encodes a `Temporal.Instant`,
 * not a `Date` — passing `new Date()` fails with
 * `RUNTIME.ENCODE_FAILED`. Returns `any` so it stays assignable to the
 * generated codec input type regardless of which TS libs declare `Temporal`.
 */
export const nowInstant = (): any => {
  const TemporalApi = (globalThis as Record<string, any>)["Temporal"];
  if (!TemporalApi?.Now?.instant) {
    throw new Error(
      "Temporal API is not available in this runtime. Use a Bun/Node version with Temporal support to write timestamp columns."
    );
  }
  return TemporalApi.Now.instant();
};

/**
 * A `Temporal.Instant` `days` days in the future, for `expiresAt`-style
 * columns. Arithmetic runs on epoch milliseconds so it stays exact across
 * DST boundaries.
 */
export const daysFromNowInstant = (days: number): any => {
  const now = nowInstant() as { epochMilliseconds: number };
  const TemporalApi = (globalThis as Record<string, any>)["Temporal"];
  return TemporalApi.Instant.fromEpochMilliseconds(
    now.epochMilliseconds + days * 24 * 60 * 60 * 1000
  );
};

/** Epoch milliseconds for a `timestamptz` codec value (or null/undefined). */
export const instantToEpochMs = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  const asInstant = value as { epochMilliseconds?: unknown };
  if (typeof asInstant.epochMilliseconds === "number") {
    return asInstant.epochMilliseconds;
  }
  return null;
};

/**
 * Normalize any `timestamptz` codec value to an ISO string for API
 * responses. The Prisma 8 temporal codec returns `Temporal.Instant`
 * instances, which must not leak into JSON payloads unconverted.
 */
export const toISOStringSafe = (value: unknown): string | null => {
  const ms = instantToEpochMs(value);
  if (ms === null) return null;
  return new Date(ms).toISOString();
};

/** True when `expiresAt` is set and lies before `nowMs`. */
export const isInstantExpired = (
  expiresAt: unknown,
  nowMs: number = Date.now()
): boolean => {
  const ms = instantToEpochMs(expiresAt);
  if (ms === null) return true;
  return ms < nowMs;
};
