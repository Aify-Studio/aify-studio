CREATE TABLE `chat` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`chat_id` text,
	`role` text NOT NULL,
	`parts` text NOT NULL,
	`created_at` integer NOT NULL
);
