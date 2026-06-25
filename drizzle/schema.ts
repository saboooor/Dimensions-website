import { sqliteTable, integer, text, primaryKey } from "drizzle-orm/sqlite-core";

// ─── Auth.js Adapter Tables ──────────────────────────────────────────────────

/**
 * Core user table — aligned with Auth.js adapter expectations.
 * Domain-specific fields are appended after the Auth.js standard columns.
 */
export const users = sqliteTable("users", {
  // Auth.js standard fields
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),

  // Domain-specific fields
  username: text("username").unique(),
  rank: text("rank").default("").notNull(),
  badges: text("badges").default("[]").notNull(), // JSON array of badge IDs
  points: integer("points").default(0).notNull(),
  enabledAds: integer("enabledAds").default(1).notNull(), // 0 or 1
  disabledAds: integer("disabledAds").default(0).notNull(),
  lastAdClaim: text("lastAdClaim").default("0000-00-00").notNull(),
  ingameCosmetics: text("ingameCosmetics")
    .default('{"postIgnitePortal":"NOTHING","postUsePortal":"NOTHING","postDestroyPortal":"NOTHING","onPortalTick":"NOTHING"}')
    .notNull(), // JSON string
  discordAccount: text("discordAccount").default("").notNull(),
  minecraftAccount: text("minecraftAccount").default("").notNull(),
  verifiedPaypal: text("verifiedPaypal").default("").notNull(),
  profileImage: text("profileImage").default("").notNull(),
});

/**
 * OAuth accounts — stores provider tokens (e.g. Discord).
 * Required by the Auth.js Drizzle adapter.
 */
export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);

/**
 * Sessions — required by Auth.js Drizzle adapter (database strategy).
 */
export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

/**
 * Verification tokens — used for email sign-in magic links (not currently used with Discord-only flow, but required by the adapter).
 */
export const verificationTokens = sqliteTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Domain Tables ────────────────────────────────────────────────────────────

// Badges Table
export const badges = sqliteTable("badges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

// Portals Table
export const userPortals = sqliteTable("user_portals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  maker: text("maker").notNull(), // references users.id (text UUID)
  portalID: text("portalID").notNull(),
  data: text("data").notNull(), // YAML/JSON portal configuration data
  img: text("img").notNull(), // preview image URL
  public: integer("public").default(0).notNull(), // 0 or 1
  liked: text("liked").default("[]").notNull(), // JSON array of user IDs who liked
});

// Cosmetics Table
export const cosmetics = sqliteTable("cosmetics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
  access: text("access").notNull(), // JSON array of ranks/usernames
  used: text("used").notNull(), // JSON array of event types (ignite, destroy, use, tick)
});

// Registered Addons Table
export const registeredAddons = sqliteTable("registered_addons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
  description: text("description").notNull(),
  portalOptions: text("portalOptions").notNull(), // JSON options
});

// Dimensions Subscriptions Table
export const dimensionsSubscriptions = sqliteTable("dimensionsSubscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serverUnique: text("serverUnique").unique().notNull(),
  linkedUser: text("linkedUser").default("").notNull(), // user ID of the subscription owner
  trial: text("trial").default("0000-00-00").notNull(),
});

// Subscription Network Table
export const subscriptionNetwork = sqliteTable("subscription_network", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user: text("user").notNull(), // user ID (text UUID)
  serverUnique: text("serverUnique").notNull(), // formatted like "!server1!server2!"
});

// Subscription Coupons Table
export const subscriptionCoupons = sqliteTable("subscription_coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  isSubscription: integer("isSubscription").notNull(), // 0 (points) or 1 (sub/trial extend)
  coupon: text("coupon").unique().notNull(),
  period: text("period").notNull(),
  uses: integer("uses").default(-1).notNull(),
  valid: text("valid").default("0000-00-00").notNull(),
  usedBy: text("usedBy").default("").notNull(), // formatted like "!user1!user2!"
});

// Claim Rewards Table
export const claimRewards = sqliteTable("claim_rewards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  type: text("type").notNull(),
  code: text("code").unique().notNull(),
  inputPrompt: text("inputPrompt"),
  requiresReview: integer("requiresReview").default(0).notNull(), // 0 or 1
});

// Claim Requests Table
export const claimRequests = sqliteTable("claim_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user: text("user").notNull(), // user ID (text UUID)
  type: text("type").notNull(),
  status: text("status").notNull(),
  input: text("input"),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;

export type UserPortal = typeof userPortals.$inferSelect;
export type NewUserPortal = typeof userPortals.$inferInsert;

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;

export type Cosmetic = typeof cosmetics.$inferSelect;
export type NewCosmetic = typeof cosmetics.$inferInsert;

export type RegisteredAddon = typeof registeredAddons.$inferSelect;
export type NewRegisteredAddon = typeof registeredAddons.$inferInsert;

export type DimensionsSubscription = typeof dimensionsSubscriptions.$inferSelect;
export type NewDimensionsSubscription = typeof dimensionsSubscriptions.$inferInsert;

export type SubscriptionNetwork = typeof subscriptionNetwork.$inferSelect;
export type NewSubscriptionNetwork = typeof subscriptionNetwork.$inferInsert;

export type SubscriptionCoupon = typeof subscriptionCoupons.$inferSelect;
export type NewSubscriptionCoupon = typeof subscriptionCoupons.$inferInsert;

export type ClaimReward = typeof claimRewards.$inferSelect;
export type NewClaimReward = typeof claimRewards.$inferInsert;

export type ClaimRequest = typeof claimRequests.$inferSelect;
export type NewClaimRequest = typeof claimRequests.$inferInsert;
