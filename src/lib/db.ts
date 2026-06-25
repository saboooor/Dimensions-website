import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import type { RequestEvent, RequestEventCommon } from "@builder.io/qwik-city";
import * as schema from "../../drizzle/schema";

// Re-export all schema tables and type definitions
export * from "../../drizzle/schema";

export type AppDatabase = DrizzleD1Database<typeof schema>;

let _db: AppDatabase;

/**
 * Retrieves the Drizzle ORM client bound to the Cloudflare D1 database.
 * Supports parameterless call if already initialized via the onRequest plugin.
 */
export function getDB(requestEvent?: RequestEvent | RequestEventCommon): AppDatabase {
  if (_db) return _db;

  if (!requestEvent) {
    throw new Error("D1 Database not initialized and no requestEvent provided.");
  }

  const env = (requestEvent.platform as any)?.env;
  if (!env || !env.DB) {
    throw new Error(
      "Cloudflare D1 Database binding (DB) is not available. Make sure you are running the app using 'pnpm run serve' (wrangler pages dev) or deploying to Cloudflare."
    );
  }
  
  _db = drizzle(env.DB, { schema });
  return _db;
}

/**
 * Initializes the Drizzle database instance if it has not been set yet.
 */
export async function initializeDbIfNeeded(
  factory: () => Promise<AppDatabase>
) {
  if (!_db) {
    _db = await factory();
  }
}
