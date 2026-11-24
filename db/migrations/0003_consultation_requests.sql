CREATE TABLE `consultation_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`mobile_key` text NOT NULL,
	`ip_key` text NOT NULL,
	`hash` text,
	`issued_at` integer NOT NULL,
	`expires_at` integer,
	`attempts` integer DEFAULT 0 NOT NULL,
	`state` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `consultation_codes_request_idx` ON `consultation_codes` (`request_id`);--> statement-breakpoint
CREATE INDEX `consultation_codes_mobile_idx` ON `consultation_codes` (`mobile_key`,`issued_at`);--> statement-breakpoint
CREATE INDEX `consultation_codes_ip_idx` ON `consultation_codes` (`ip_key`,`issued_at`);--> statement-breakpoint
CREATE INDEX `consultation_codes_issued_idx` ON `consultation_codes` (`issued_at`);--> statement-breakpoint
CREATE TABLE `consultation_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mobile` text NOT NULL,
	`messenger` text,
	`topic` text NOT NULL,
	`other_topic` text,
	`description` text NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL
);
