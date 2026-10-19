CREATE TABLE `question_slug_redirects` (
	`from_slug` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `question_slug_redirects_question_idx` ON `question_slug_redirects` (`question_id`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`tracking_code_hash` text,
	`display_name` text DEFAULT '' NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`original_title` text NOT NULL,
	`original_body` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`answer` text DEFAULT '' NOT NULL,
	`answered_by` text,
	`answered_at` integer,
	`published_at` integer,
	`rejection_reason` text DEFAULT '' NOT NULL,
	`admin_note` text DEFAULT '' NOT NULL,
	`related_articles` text DEFAULT '[]' NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`meta_title` text DEFAULT '' NOT NULL,
	`meta_description` text DEFAULT '' NOT NULL,
	`search_text` text DEFAULT '' NOT NULL,
	`ip_hash` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `questions_slug_unique` ON `questions` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `questions_tracking_code_hash_unique` ON `questions` (`tracking_code_hash`);--> statement-breakpoint
CREATE INDEX `questions_status_idx` ON `questions` (`status`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `questions_published_idx` ON `questions` (`published_at`);--> statement-breakpoint
CREATE INDEX `questions_category_idx` ON `questions` (`category`);--> statement-breakpoint
CREATE INDEX `questions_created_idx` ON `questions` (`created_at`);