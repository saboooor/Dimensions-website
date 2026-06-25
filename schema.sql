-- SQLite Database Schema for Dimensions Website (Cloudflare D1)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  verified TEXT NOT NULL,
  badges TEXT DEFAULT '[]', -- JSON array of badge IDs
  rank TEXT DEFAULT '',
  enabledAds INTEGER DEFAULT 1, -- 0 or 1
  disabledAds INTEGER DEFAULT 0,
  lastAdClaim TEXT DEFAULT '0000-00-00',
  points INTEGER DEFAULT 0,
  ingameCosmetics TEXT DEFAULT '{"postIgnitePortal":"NOTHING","postUsePortal":"NOTHING","postDestroyPortal":"NOTHING","onPortalTick":"NOTHING"}',
  discordAccount TEXT DEFAULT '',
  patreonAccount TEXT DEFAULT '',
  patreonRefresh TEXT DEFAULT '',
  minecraftAccount TEXT DEFAULT '',
  verifiedPaypal TEXT DEFAULT '',
  profileImage TEXT DEFAULT ''
);

-- Badges Table
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL
);

-- Portals Table
CREATE TABLE IF NOT EXISTS user_portals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maker INTEGER NOT NULL,
  portalID TEXT NOT NULL,
  data TEXT NOT NULL, -- YAML/JSON portal configuration data
  img TEXT NOT NULL, -- preview image URL
  public INTEGER DEFAULT 0, -- 0 or 1
  liked TEXT DEFAULT '[]' -- JSON array of user IDs who liked
);

-- Cosmetics Table
CREATE TABLE IF NOT EXISTS cosmetics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  access TEXT NOT NULL, -- JSON array of ranks/usernames
  used TEXT NOT NULL -- JSON array of event types (ignite, destroy, use, tick)
);

-- Registered Addons Table
CREATE TABLE IF NOT EXISTS registered_addons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  portalOptions TEXT NOT NULL -- JSON options
);

-- Dimensions Subscriptions Table
CREATE TABLE IF NOT EXISTS dimensionsSubscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serverUnique TEXT UNIQUE NOT NULL,
  patreonAccount TEXT DEFAULT '',
  patreonRefresh TEXT DEFAULT '',
  trial TEXT DEFAULT '0000-00-00'
);

-- Subscription Network Table
CREATE TABLE IF NOT EXISTS subscription_network (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user INTEGER NOT NULL,
  serverUnique TEXT NOT NULL -- formatted like "!server1!server2!"
);

-- Subscription Coupons Table
CREATE TABLE IF NOT EXISTS subscription_coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isSubscription INTEGER NOT NULL, -- 0 (points) or 1 (sub/trial extend)
  coupon TEXT UNIQUE NOT NULL,
  period TEXT NOT NULL,
  uses INTEGER DEFAULT -1,
  valid TEXT DEFAULT '0000-00-00',
  usedBy TEXT DEFAULT '' -- formatted like "!user1!user2!"
);

-- Claim Rewards Table
CREATE TABLE IF NOT EXISTS claim_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  type TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  inputPrompt TEXT DEFAULT NULL,
  requiresReview INTEGER DEFAULT 0 -- 0 or 1
);

-- Claim Requests Table
CREATE TABLE IF NOT EXISTS claim_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  input TEXT DEFAULT NULL
);

-- Insert Initial/Default Data
INSERT OR IGNORE INTO badges (id, name, description, icon) VALUES
(1, 'Beta Tester', 'Helped test the early versions of the plugin', 'bi bi-bug'),
(2, 'Top Supporter', 'Supported the project through Patreon or donations', 'bi bi-heart-fill'),
(3, 'Portal Master', 'Created a highly popular portal layout', 'bi bi-magic');

INSERT OR IGNORE INTO claim_rewards (id, name, price, type, code, inputPrompt, requiresReview) VALUES
(1, 'Premium In-game Badge', 500, 'In-game', 'badge_premium', NULL, 0),
(2, 'Custom Portal Particle Effect', 1000, 'In-game', 'particle_custom', 'Enter your particle name/hex color', 1),
(3, '1 Month Premium Subscription Extension', 1500, 'Subscription', 'sub_1m', 'Enter serverUnique ID', 0);
