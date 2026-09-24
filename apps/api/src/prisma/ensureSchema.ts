import { readFile } from "node:fs/promises";
import { Client } from "pg";
import contractJson from "./contract.json" with { type: "json" };

/**
 * Dev schema bootstrap. On boot the API verifies the live PostgreSQL schema
 * against the emitted Prisma 8 contract (`contract.json`, the exact physical
 * schema the runtime queries). If any expected table/column is missing (e.g.
 * a stale sample schema from an old migration), it applies
 * `migrations/vaultgraph-schema-fix.sql` (drop stale tables + recreate),
 * then the server starts against a matching schema.
 *
 * - Healthy databases: a single information_schema probe, no writes.
 * - Broken/empty databases: rebuilt once; legacy rows in stale tables are
 *   dev-only test data (the app cannot read them anyway — every query 500s).
 * - Production should manage schema with real migrations; set
 *   SKIP_SCHEMA_BOOTSTRAP=1 to skip this check entirely.
 */

type ContractTables = Record<string, { columns: Record<string, object> }>;

function expectedColumns(): Map<string, Set<string>> {
  const tables = (
    contractJson as unknown as {
      storage: {
        namespaces: { public: { entries: { table: ContractTables } } };
      };
    }
  ).storage.namespaces.public.entries.table;
  const out = new Map<string, Set<string>>();
  for (const [table, spec] of Object.entries(tables)) {
    out.set(table, new Set(Object.keys(spec.columns)));
  }
  return out;
}

export async function ensureSchema(): Promise<void> {
  if (process.env["SKIP_SCHEMA_BOOTSTRAP"] === "1") return;
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is not set. Add it to your .env file.");

  const client = new Client({ connectionString: url });
  try {
    await client.connect();

    const actual = await client.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = 'public'`
    );
    const actualByTable = new Map<string, Set<string>>();
    for (const row of actual.rows) {
      const cols = actualByTable.get(row.table_name) ?? new Set<string>();
      cols.add(row.column_name);
      actualByTable.set(row.table_name, cols);
    }

    const missing: string[] = [];
    for (const [table, cols] of expectedColumns()) {
      const have = actualByTable.get(table) ?? new Set<string>();
      for (const col of cols) {
        if (!have.has(col)) missing.push(`${table}.${col}`);
      }
    }

    if (missing.length === 0) {
      console.log("Database schema matches the Prisma contract.");
      return;
    }

    console.warn(
      `Database schema mismatch (missing: ${missing.join(", ")}). ` +
        `Rebuilding VaultGraph tables from migrations/vaultgraph-schema-fix.sql ...`
    );
    const sql = await readFile(
      new URL("../../migrations/vaultgraph-schema-fix.sql", import.meta.url),
      "utf8"
    );
    await client.query(sql);
    console.log("Database schema rebuilt to match the Prisma contract.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Schema bootstrap failed: ${message}. ` +
        `Check DATABASE_URL and that PostgreSQL is reachable, then restart.`
    );
  } finally {
    await client.end().catch(() => {
      /* connection already closed/failed — boot error above carries the cause */
    });
  }
}
