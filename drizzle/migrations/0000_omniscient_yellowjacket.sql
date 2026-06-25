CREATE TABLE `accounts` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `claim_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`input` text
);
--> statement-breakpoint
CREATE TABLE `claim_rewards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`type` text NOT NULL,
	`code` text NOT NULL,
	`inputPrompt` text,
	`requiresReview` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `claim_rewards_code_unique` ON `claim_rewards` (`code`);--> statement-breakpoint
CREATE TABLE `cosmetics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`access` text NOT NULL,
	`used` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cosmetics_name_unique` ON `cosmetics` (`name`);--> statement-breakpoint
CREATE TABLE `dimensionsSubscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`serverUnique` text NOT NULL,
	`linkedUser` text DEFAULT '' NOT NULL,
	`trial` text DEFAULT '0000-00-00' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dimensionsSubscriptions_serverUnique_unique` ON `dimensionsSubscriptions` (`serverUnique`);--> statement-breakpoint
CREATE TABLE `registered_addons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`portalOptions` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registered_addons_name_unique` ON `registered_addons` (`name`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscription_coupons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`isSubscription` integer NOT NULL,
	`coupon` text NOT NULL,
	`period` text NOT NULL,
	`uses` integer DEFAULT -1 NOT NULL,
	`valid` text DEFAULT '0000-00-00' NOT NULL,
	`usedBy` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_coupons_coupon_unique` ON `subscription_coupons` (`coupon`);--> statement-breakpoint
CREATE TABLE `subscription_network` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user` text NOT NULL,
	`serverUnique` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_portals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`maker` text NOT NULL,
	`portalID` text NOT NULL,
	`data` text NOT NULL,
	`img` text NOT NULL,
	`public` integer DEFAULT 0 NOT NULL,
	`liked` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text,
	`username` text,
	`rank` text DEFAULT '' NOT NULL,
	`badges` text DEFAULT '[]' NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`enabledAds` integer DEFAULT 1 NOT NULL,
	`disabledAds` integer DEFAULT 0 NOT NULL,
	`lastAdClaim` text DEFAULT '0000-00-00' NOT NULL,
	`ingameCosmetics` text DEFAULT '{"postIgnitePortal":"NOTHING","postUsePortal":"NOTHING","postDestroyPortal":"NOTHING","onPortalTick":"NOTHING"}' NOT NULL,
	`discordAccount` text DEFAULT '' NOT NULL,
	`minecraftAccount` text DEFAULT '' NOT NULL,
	`verifiedPaypal` text DEFAULT '' NOT NULL,
	`profileImage` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `verificationTokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
