-- Migration: Add documentation tables
-- Created: 2026-03-13

-- Create documentation_folder table
CREATE TABLE IF NOT EXISTS `documentation_folder` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL REFERENCES `project`(`id`) ON DELETE CASCADE,
	`name` text NOT NULL,
	`parent_folder_id` text REFERENCES `documentation_folder`(`id`) ON DELETE CASCADE,
	`position` integer NOT NULL DEFAULT 0,
	`created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
	`updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE INDEX IF NOT EXISTS `documentation_folder_projectId_idx` ON `documentation_folder`(`project_id`);
CREATE INDEX IF NOT EXISTS `documentation_folder_parentFolderId_idx` ON `documentation_folder`(`parent_folder_id`);

-- Create documentation_page table
CREATE TABLE IF NOT EXISTS `documentation_page` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL REFERENCES `project`(`id`) ON DELETE CASCADE,
	`folder_id` text REFERENCES `documentation_folder`(`id`) ON DELETE CASCADE,
	`title` text NOT NULL,
	`content` text NOT NULL DEFAULT '',
	`visibility` text NOT NULL DEFAULT 'private' CHECK (`visibility` IN ('public', 'private')),
	`author_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
	`position` integer NOT NULL DEFAULT 0,
	`created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
	`updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE INDEX IF NOT EXISTS `documentation_page_projectId_idx` ON `documentation_page`(`project_id`);
CREATE INDEX IF NOT EXISTS `documentation_page_folderId_idx` ON `documentation_page`(`folder_id`);
CREATE INDEX IF NOT EXISTS `documentation_page_authorId_idx` ON `documentation_page`(`author_id`);
