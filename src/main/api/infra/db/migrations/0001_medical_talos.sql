CREATE TABLE `ai_model` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`name` text NOT NULL,
	`attachment` integer NOT NULL,
	`reasoning` integer NOT NULL,
	`tool_call` integer NOT NULL,
	`structured_output` integer,
	`temperature` integer,
	`interleaved` text,
	`cost` text NOT NULL,
	`limit` text NOT NULL,
	`modalities` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_provider` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`desc` text,
	`doc` text,
	`type` text NOT NULL,
	`api` text,
	`api_key` text,
	`logo` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`default_value` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
