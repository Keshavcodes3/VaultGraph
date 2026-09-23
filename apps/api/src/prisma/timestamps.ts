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
