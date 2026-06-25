import { type RequestHandler } from "@builder.io/qwik-city";
import { sql, eq, or } from "drizzle-orm";
import { dump } from "js-yaml";
import { getDB, users, userPortals } from "~/lib/db";

// Helper to convert flat state to nested object for YAML conversion
function toNested(state: Record<string, any>) {
  const result: Record<string, any> = {};
  for (const key of Object.keys(state)) {
    const val = state[key];
    if (val === "skip" || val === undefined) continue;

    if (key.indexOf(".") === -1) {
      result[key] = val;
    } else {
      const parts = key.split(".");
      let obj = result;
      for (let j = 0; j < parts.length; j++) {
        if (j === parts.length - 1) {
          obj[parts[j]] = val;
        } else {
          if (!obj[parts[j]] || typeof obj[parts[j]] !== "object") {
            obj[parts[j]] = {};
          }
          obj = obj[parts[j]];
        }
      }
    }
  }
  return result;
}

export const onGet: RequestHandler = async (requestEvent) => {
  const rawUuid = requestEvent.url.searchParams.get("all") || "";
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

  // 2. Fetch portals
  // If we found a user: fetch portals they created (including private ones), plus all other public portals.
  // If no user: fetch all public portals.
  let portalsList = [];
  if (userRow) {
    portalsList = await db.query.userPortals.findMany({
      where: or(
        eq(userPortals.public, 1),
        eq(userPortals.maker, userRow.id)
      ),
    });
  } else {
    portalsList = await db.query.userPortals.findMany({
      where: eq(userPortals.public, 1),
    });
  }

  // 3. Fetch all creators to map usernames
  const allUsers = await db.query.users.findMany();
  const userMap = new Map(allUsers.map(u => [u.id, u.username]));

  // 4. Build response mapping
  const responseMap: Record<string, any> = {};

  for (const portal of portalsList) {
    let likesCount = 0;
    try {
      likesCount = JSON.parse(portal.liked).length;
    } catch (e) {
      // ignore
    }

    let blockMaterial = "STONE";
    let yamlString = "";

    try {
      // Parse portal save string
      const parsedData = JSON.parse(portal.data);
      const portalState = parsedData.data || {};
      
      // Extract frame material (defaults to STONE if not found)
      blockMaterial = portalState["Portal.Frame.Material"] || "STONE";
      
      // Convert to nested object and then to YAML
      const nested = toNested(portalState);
      yamlString = dump(nested);
    } catch (e) {
      console.error(`Failed to parse portal data for ID ${portal.id}`, e);
    }

    const creatorName = userMap.get(portal.maker) || "Unknown";

    responseMap[portal.id.toString()] = {
      file: portal.portalID,
      creator: creatorName,
      likes: likesCount,
      block: blockMaterial,
      yml: yamlString,
    };
  }

  requestEvent.headers.set("Content-Type", "application/json");
  requestEvent.send(200, JSON.stringify(responseMap));
};
