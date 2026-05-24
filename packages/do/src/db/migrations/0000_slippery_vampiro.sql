CREATE TABLE IF NOT EXISTS `board` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`visibility` text DEFAULT 'private' NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `board_ownerId_idx` ON `board` (`owner_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `board_member` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `board_member_boardId_idx` ON `board_member` (`board_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `board_member_userId_idx` ON `board_member` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `board_member_unique_idx` ON `board_member` (`board_id`,`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `card` (
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
	`archived_date` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_columnId_idx` ON `card` (`column_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_position_idx` ON `card` (`column_id`,`position`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_assigneeId_idx` ON `card` (`assignee_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_boardId_idx` ON `card` (`board_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `card_comment` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_comment_cardId_idx` ON `card_comment` (`card_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_comment_createdAt_idx` ON `card_comment` (`created_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `card_history` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`field_name` text,
	`old_value` text,
	`new_value` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_history_cardId_idx` ON `card_history` (`card_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_history_createdAt_idx` ON `card_history` (`created_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `card_label` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6366f1' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_label_cardId_idx` ON `card_label` (`card_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `card_link` (
	`id` text PRIMARY KEY NOT NULL,
	`source_card_id` text NOT NULL,
	`target_card_id` text NOT NULL,
	`link_type` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_link_sourceCardId_idx` ON `card_link` (`source_card_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_link_targetCardId_idx` ON `card_link` (`target_card_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `card_link_card_pair_idx` ON `card_link` (`source_card_id`,`target_card_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `column` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `column_boardId_idx` ON `column` (`board_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `column_position_idx` ON `column` (`board_id`,`position`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `documentation_folder` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_folder_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `documentation_folder_parentFolderId_idx` ON `documentation_folder` (`parent_folder_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `documentation_page` (
	`id` text PRIMARY KEY NOT NULL,
	`folder_id` text,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`author_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `documentation_page_folderId_idx` ON `documentation_page` (`folder_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `documentation_page_authorId_idx` ON `documentation_page` (`author_id`);
