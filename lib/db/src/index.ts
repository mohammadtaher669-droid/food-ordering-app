import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// DATABASE_URL is intentionally not checked at module load time.
// Railway reference variables (e.g. ${{ Postgres.DATABASE_URL }}) are resolved
// at runtime, so the value may not be present when this module is first
// imported. The pool and db instances are created lazily on first access so
// that the module can be imported (and migrations can be registered) before
// the variable is guaranteed to be set.

let _pool: pg.Pool | undefined;
let _db: NodePgDatabase<typeof schema> | undefined;

function getPool(): pg.Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});

export const db: NodePgDatabase<typeof schema> = new Proxy(
  {} as NodePgDatabase<typeof schema>,
  {
    get(_target, prop) {
      return (getDb() as any)[prop];
    },
  },
);

export * from "./schema";
