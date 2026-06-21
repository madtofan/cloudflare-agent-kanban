import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const project = sqliteTable(
	"project",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		description: text("description"),
		visibility: text("visibility", { enum: ["private", "public"] })
			.notNull()
			.default("private"),
		ownerId: text("owner_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("project_ownerId_idx").on(table.ownerId)]
);

export const projectRelations = relations(project, ({ many, one }) => ({
	members: many(projectMember),
	owner: one(user, {
		fields: [project.ownerId],
		references: [user.id],
	}),
}));

export const projectMember = sqliteTable(
	"project_member",
	{
		id: text("id").primaryKey(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: text("role", { enum: ["admin", "member"] })
			.notNull()
			.default("member"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("project_member_projectId_idx").on(table.projectId),
		index("project_member_userId_idx").on(table.userId),
		index("project_member_unique_idx").on(table.projectId, table.userId),
	]
);

export const projectMemberRelations = relations(projectMember, ({ one }) => ({
	project: one(project, {
		fields: [projectMember.projectId],
		references: [project.id],
	}),
	user: one(user, {
		fields: [projectMember.userId],
		references: [user.id],
	}),
}));

export const apiToken = sqliteTable(
	"api_token",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		tokenHash: text("token_hash").notNull().unique(),
		partialToken: text("partial_token").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
		lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("api_token_userId_idx").on(table.userId),
		index("api_token_projectId_idx").on(table.projectId),
	]
);

export const apiTokenRelations = relations(apiToken, ({ one }) => ({
	user: one(user, {
		fields: [apiToken.userId],
		references: [user.id],
	}),
	project: one(project, {
		fields: [apiToken.projectId],
		references: [project.id],
	}),
}));
