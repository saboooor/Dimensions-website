import { type RequestHandler } from "@builder.io/qwik-city";
import { sql, eq, or } from "drizzle-orm";
import { getDB, users } from "~/lib/db";

const DEFAULT_COSMETICS = {
  postIgnitePortal: "NOTHING",
  postUsePortal: "NOTHING",
  postDestroyPortal: "NOTHING",
  onPortalTick: "NOTHING",
};

export const onGet: RequestHandler = async (requestEvent) => {
  const rawUuid = requestEvent.url.searchParams.get("ingameCosmetics") || "";
  const uuid = rawUuid.replace(/-/g, "").toLowerCase();

  const db = getDB(requestEvent);

  // 1. Find user by Minecraft UUID (with or without dashes)
  let userRow = null;
  if (uuid) {
    userRow = await db.query.users.findFirst({
      where: or(
        eq(users.minecraftAccount, rawUuid),
        eq(users.minecraftAccount, uuid),
        eq(sql`REPLACE(LOWER(${users.minecraftAccount}), '-', '')`, uuid)
      ),
    });
  }

  // 2. Parse cosmetics or return defaults
  let cosmetics = DEFAULT_COSMETICS;
  if (userRow) {
    try {
      cosmetics = {
        ...DEFAULT_COSMETICS,
        ...JSON.parse(userRow.ingameCosmetics),
      };
    } catch (e) {
      // ignore
    }
  }

  requestEvent.headers.set("Content-Type", "application/json");
  requestEvent.send(200, JSON.stringify(cosmetics));
};
