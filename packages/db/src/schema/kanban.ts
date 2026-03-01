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
	boards: many(board),
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

export const board = sqliteTable(
	"board",
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
		projectId: text("project_id").references(() => project.id, {
			onDelete: "set null",
		}),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("board_ownerId_idx").on(table.ownerId),
		index("board_projectId_idx").on(table.projectId),
	]
);

export const boardRelations = relations(board, ({ many, one }) => ({
	columns: many(column),
	members: many(boardMember),
	owner: one(user, {
		fields: [board.ownerId],
		references: [user.id],
	}),
	project: one(project, {
		fields: [board.projectId],
		references: [project.id],
	}),
}));

export const column = sqliteTable(
	"column",
	{
		id: text("id").primaryKey(),
		boardId: text("board_id")
			.notNull()
			.references(() => board.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
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
		index("column_boardId_idx").on(table.boardId),
		index("column_position_idx").on(table.boardId, table.position),
	]
);

export const columnRelations = relations(column, ({ one, many }) => ({
	board: one(board, {
		fields: [column.boardId],
		references: [board.id],
	}),
	cards: many(card),
}));

export const card = sqliteTable(
	"card",
	{
		id: text("id").primaryKey(),
		boardId: text("board_id")
			.notNull()
			.references(() => board.id, { onDelete: "cascade" }),
		cardNumber: integer("card_number").notNull(),
		columnId: text("column_id")
			.notNull()
			.references(() => column.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		type: text("type", {
			enum: ["epic", "feature", "user_story", "bug", "task"],
		}).notNull(),
		description: text("description"),
		acceptanceCriteria: text("acceptance_criteria"),
		position: integer("position").notNull().default(0),
		assigneeId: text("assignee_id").references(() => user.id, {
			onDelete: "set null",
		}),
		agentTriggerUrl: text("agent_trigger_url"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("card_columnId_idx").on(table.columnId),
		index("card_position_idx").on(table.columnId, table.position),
		index("card_assigneeId_idx").on(table.assigneeId),
		index("card_boardId_idx").on(table.boardId),
	]
);

export const cardRelations = relations(card, ({ one, many }) => ({
	board: one(board, {
		fields: [card.boardId],
		references: [board.id],
	}),
	column: one(column, {
		fields: [card.columnId],
		references: [column.id],
	}),
	assignee: one(user, {
		fields: [card.assigneeId],
		references: [user.id],
	}),
	labels: many(cardLabel),
	comments: many(cardComment),
	outgoingLinks: many(cardLink, {
		relationName: "sourceCard",
	}),
	incomingLinks: many(cardLink, {
		relationName: "targetCard",
	}),
}));

export const boardMember = sqliteTable(
	"board_member",
	{
		id: text("id").primaryKey(),
		boardId: text("board_id")
			.notNull()
			.references(() => board.id, { onDelete: "cascade" }),
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
		index("board_member_boardId_idx").on(table.boardId),
		index("board_member_userId_idx").on(table.userId),
		index("board_member_unique_idx").on(table.boardId, table.userId),
	]
);

export const boardMemberRelations = relations(boardMember, ({ one }) => ({
	board: one(board, {
		fields: [boardMember.boardId],
		references: [board.id],
	}),
	user: one(user, {
		fields: [boardMember.userId],
		references: [user.id],
	}),
}));

export const cardLabel = sqliteTable(
	"card_label",
	{
		id: text("id").primaryKey(),
		cardId: text("card_id")
			.notNull()
			.references(() => card.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		color: text("color").notNull().default("#6366f1"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [index("card_label_cardId_idx").on(table.cardId)]
);

export const cardLabelRelations = relations(cardLabel, ({ one }) => ({
	card: one(card, {
		fields: [cardLabel.cardId],
		references: [card.id],
	}),
}));

export const cardHistory = sqliteTable(
	"card_history",
	{
		id: text("id").primaryKey(),
		cardId: text("card_id")
			.notNull()
			.references(() => card.id, { onDelete: "cascade" }),
		userId: text("user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		action: text("action").notNull(),
		fieldName: text("field_name"),
		oldValue: text("old_value"),
		newValue: text("new_value"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("card_history_cardId_idx").on(table.cardId),
		index("card_history_createdAt_idx").on(table.createdAt),
	]
);

export const cardHistoryRelations = relations(cardHistory, ({ one }) => ({
	card: one(card, {
		fields: [cardHistory.cardId],
		references: [card.id],
	}),
	user: one(user, {
		fields: [cardHistory.userId],
		references: [user.id],
	}),
}));

export const cardComment = sqliteTable(
	"card_comment",
	{
		id: text("id").primaryKey(),
		cardId: text("card_id")
			.notNull()
			.references(() => card.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("card_comment_cardId_idx").on(table.cardId),
		index("card_comment_createdAt_idx").on(table.createdAt),
	]
);

export const cardCommentRelations = relations(cardComment, ({ one }) => ({
	card: one(card, {
		fields: [cardComment.cardId],
		references: [card.id],
	}),
	user: one(user, {
		fields: [cardComment.userId],
		references: [user.id],
	}),
}));

export const cardLinkType = [
	"parent_of",
	"child_of",
	"blocked_by",
	"blocks",
	"depends_on",
	"relates_to",
	"duplicates",
	"follows",
	"part_of",
	"implements",
] as const;

export type CardLinkType = (typeof cardLinkType)[number];

export const cardLink = sqliteTable(
	"card_link",
	{
		id: text("id").primaryKey(),
		sourceCardId: text("source_card_id")
			.notNull()
			.references(() => card.id, { onDelete: "cascade" }),
		targetCardId: text("target_card_id")
			.notNull()
			.references(() => card.id, { onDelete: "cascade" }),
		linkType: text("link_type", { enum: cardLinkType }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("card_link_sourceCardId_idx").on(table.sourceCardId),
		index("card_link_targetCardId_idx").on(table.targetCardId),
		index("card_link_card_pair_idx").on(table.sourceCardId, table.targetCardId),
	]
);

export const cardLinkRelations = relations(cardLink, ({ one }) => ({
	sourceCard: one(card, {
		fields: [cardLink.sourceCardId],
		references: [card.id],
		relationName: "sourceCard",
	}),
	targetCard: one(card, {
		fields: [cardLink.targetCardId],
		references: [card.id],
		relationName: "targetCard",
	}),
}));
