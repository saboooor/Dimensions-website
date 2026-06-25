import { type RequestHandler } from "@builder.io/qwik-city";
import { drizzle } from "drizzle-orm/d1";
import { initializeDbIfNeeded } from "~/lib/db";

export const onRequest: RequestHandler = async ({ platform }) => {
  const env = (platform as any)?.env;
  if (env && env.DB) {
    await initializeDbIfNeeded(async () => drizzle(env.DB));
  }
};
