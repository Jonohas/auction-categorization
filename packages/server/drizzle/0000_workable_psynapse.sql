CREATE TABLE `auction_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-23T15:44:27.308Z"' NOT NULL,
	`updatedAt` integer,
	`url` text,
	`title` text NOT NULL,
	`description` text,
	`image_url` text,
	`current_price` real,
	`bid_count` integer DEFAULT 0 NOT NULL,
	`main_category_id` integer,
	`auction_id` integer,
	FOREIGN KEY (`main_category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auction_items_url_unique` ON `auction_items` (`url`);--> statement-breakpoint
CREATE TABLE `auctions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-23T15:44:27.308Z"' NOT NULL,
	`updatedAt` integer,
	`url` text,
	`title` text NOT NULL,
	`description` text,
	`startDate` integer,
	`endDate` integer,
	`items` text NOT NULL,
	`scraper_id` integer,
	FOREIGN KEY (`scraper_id`) REFERENCES `scrapers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auctions_url_unique` ON `auctions` (`url`);--> statement-breakpoint
CREATE INDEX `scraper_index` ON `auctions` (`scraper_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-23T15:44:27.308Z"' NOT NULL,
	`updatedAt` integer,
	`name` text NOT NULL,
	`description` text,
	`isSystem` integer
);
--> statement-breakpoint
CREATE TABLE `category_probability` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-23T15:44:27.308Z"' NOT NULL,
	`updatedAt` integer,
	`probability` real,
	`category_id` integer,
	`item_id` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `auction_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scrapers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-23T15:44:27.308Z"' NOT NULL,
	`updatedAt` integer,
	`url` text,
	`name` text NOT NULL,
	`image_url` text,
	`enabled` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scrapers_url_unique` ON `scrapers` (`url`);