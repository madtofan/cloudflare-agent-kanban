CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`source_id` text NOT NULL,
	`source_type` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`username` text,
	`display_username` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`about_me` text,
	`showcased_project_ids` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profile_user_id_unique` ON `user_profile` (`user_id`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `board` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`visibility` text DEFAULT 'private' NOT NULL,
	`owner_id` text NOT NULL,
	`project_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `board_ownerId_idx` ON `board` (`owner_id`);--> statement-breakpoint
CREATE INDEX `board_projectId_idx` ON `board` (`project_id`);--> statement-breakpoint
CREATE TABLE `board_member` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `board`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `board_member_boardId_idx` ON `board_member` (`board_id`);--> statement-breakpoint
CREATE INDEX `board_member_userId_idx` ON `board_member` (`user_id`);--> statement-breakpoint
CREATE INDEX `board_member_unique_idx` ON `board_member` (`board_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `card` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`card_number` integer NOT NULL,
	`column_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`acceptance_criteria` text,
	`position` integer DEFAULT 0 NOT NULL,
	`assignee_id` text,
	`agent_trigger_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `board`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`column_id`) REFERENCES `column`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `card_columnId_idx` ON `card` (`column_id`);--> statement-breakpoint
CREATE INDEX `card_position_idx` ON `card` (`column_id`,`position`);--> statement-breakpoint
CREATE INDEX `card_assigneeId_idx` ON `card` (`assignee_id`);--> statement-breakpoint
CREATE INDEX `card_boardId_idx` ON `card` (`board_id`);--> statement-breakpoint
CREATE TABLE `card_comment` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `card_comment_cardId_idx` ON `card_comment` (`card_id`);--> statement-breakpoint
CREATE INDEX `card_comment_createdAt_idx` ON `card_comment` (`created_at`);--> statement-breakpoint
CREATE TABLE `card_history` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`field_name` text,
	`old_value` text,
	`new_value` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `card_history_cardId_idx` ON `card_history` (`card_id`);--> statement-breakpoint
CREATE INDEX `card_history_createdAt_idx` ON `card_history` (`created_at`);--> statement-breakpoint
CREATE TABLE `card_label` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6366f1' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `card_label_cardId_idx` ON `card_label` (`card_id`);--> statement-breakpoint
CREATE TABLE `card_link` (
	`id` text PRIMARY KEY NOT NULL,
	`source_card_id` text NOT NULL,
	`target_card_id` text NOT NULL,
	`link_type` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`source_card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `card_link_sourceCardId_idx` ON `card_link` (`source_card_id`);--> statement-breakpoint
CREATE INDEX `card_link_targetCardId_idx` ON `card_link` (`target_card_id`);--> statement-breakpoint
CREATE INDEX `card_link_card_pair_idx` ON `card_link` (`source_card_id`,`target_card_id`);--> statement-breakpoint
CREATE TABLE `column` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `board`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `column_boardId_idx` ON `column` (`board_id`);--> statement-breakpoint
CREATE INDEX `column_position_idx` ON `column` (`board_id`,`position`);--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`visibility` text DEFAULT 'private' NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_ownerId_idx` ON `project` (`owner_id`);--> statement-breakpoint
CREATE TABLE `project_member` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_member_projectId_idx` ON `project_member` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_member_userId_idx` ON `project_member` (`user_id`);--> statement-breakpoint
CREATE INDEX `project_member_unique_idx` ON `project_member` (`project_id`,`user_id`);