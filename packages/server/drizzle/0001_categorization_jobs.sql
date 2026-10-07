CREATE TABLE `categorization_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` integer DEFAULT '"2026-10-07T10:14:17.197Z"' NOT NULL,
	`updatedAt` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`item_ids` text NOT NULL,
	`total_items` integer NOT NULL,
	`processed_items` integer DEFAULT 0 NOT NULL,
	`error` text,
	`started_at` integer,
	`finished_at` integer,
	`auction_id` integer,
	FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `categorization_job_status_index` ON `categorization_jobs` (`status`);
