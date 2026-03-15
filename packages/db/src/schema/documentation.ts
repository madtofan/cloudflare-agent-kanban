import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { project } from "./kanban";

export const documentationFolder = sqliteTable(
	"documentation_folder",
	{
		id: text("id").primaryKey(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		parentFolderId: text("parent_folder_id"),
		position: integer("position").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("documentation_folder_projectId_idx").on(table.projectId),
		index("documentation_folder_parentFolderId_idx").on(table.parentFolderId),
	]
);

export const documentationPage = sqliteTable(
	"documentation_page",
	{
		id: text("id").primaryKey(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		folderId: text("folder_id"),
		title: text("title").notNull(),
		content: text("content").notNull().default(""),
		visibility: text("visibility", { enum: ["public", "private"] })
			.notNull()
			.default("private"),
		authorId: text("author_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		position: integer("position").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("documentation_page_projectId_idx").on(table.projectId),
		index("documentation_page_folderId_idx").on(table.folderId),
		index("documentation_page_authorId_idx").on(table.authorId),
	]
);

export const documentationFolderRelations = relations(
	documentationFolder,
	({ many, one }) => ({
		project: one(project, {
			fields: [documentationFolder.projectId],
			references: [project.id],
		}),
		parentFolder: one(documentationFolder, {
			fields: [documentationFolder.parentFolderId],
			references: [documentationFolder.id],
			relationName: "childFolders",
		}),
		childFolders: many(documentationFolder, {
			relationName: "childFolders",
		}),
		pages: many(documentationPage),
	})
);

export const documentationPageRelations = relations(
	documentationPage,
	({ one }) => ({
		project: one(project, {
			fields: [documentationPage.projectId],
			references: [project.id],
		}),
		folder: one(documentationFolder, {
			fields: [documentationPage.folderId],
			references: [documentationFolder.id],
		}),
		author: one(user, {
			fields: [documentationPage.authorId],
			references: [user.id],
		}),
	})
);
