import { cardLinkType } from "@cloudflare-agent-kanban/types";
import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const board = sqliteTable(
	"board",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		description: text("description"),
		visibility: text("visibility", { enum: ["private", "public"] })
			.notNull()
			.default("private"),
		ownerId: text("owner_id").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [index("board_ownerId_idx").on(table.ownerId)]
);

export const boardRelations = relations(board, ({ many }) => ({
	columns: many(column),
	members: many(boardMember),
}));

export const boardMember = sqliteTable(
	"board_member",
	{
		id: text("id").primaryKey(),
		boardId: text("board_id").notNull(),
		userId: text("user_id").notNull(),
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
}));

export const column = sqliteTable(
	"column",
	{
		id: text("id").primaryKey(),
		boardId: text("board_id").notNull(),
		name: text("name").notNull(),
		description: text("description"),
		position: integer("position").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
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
		boardId: text("board_id").notNull(),
		cardNumber: integer("card_number").notNull(),
		columnId: text("column_id").notNull(),
		title: text("title").notNull(),
		type: text("type", {
			enum: ["epic", "feature", "user_story", "bug", "task"],
		}).notNull(),
		description: text("description"),
		acceptanceCriteria: text("acceptance_criteria"),
		position: integer("position").notNull().default(0),
		assigneeId: text("assignee_id"),
		agentTriggerUrl: text("agent_trigger_url"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		archivedDate: integer("archived_date", { mode: "timestamp_ms" }),
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
	labels: many(cardLabel),
	comments: many(cardComment),
	outgoingLinks: many(cardLink, {
		relationName: "sourceCard",
	}),
	incomingLinks: many(cardLink, {
		relationName: "targetCard",
	}),
}));

export const cardLabel = sqliteTable(
	"card_label",
	{
		id: text("id").primaryKey(),
		cardId: text("card_id").notNull(),
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
		cardId: text("card_id").notNull(),
		userId: text("user_id"),
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
}));

export const cardComment = sqliteTable(
	"card_comment",
	{
		id: text("id").primaryKey(),
		cardId: text("card_id").notNull(),
		userId: text("user_id").notNull(),
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
}));

export const cardLink = sqliteTable(
	"card_link",
	{
		id: text("id").primaryKey(),
		sourceCardId: text("source_card_id").notNull(),
		targetCardId: text("target_card_id").notNull(),
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

export const documentationFolder = sqliteTable(
	"documentation_folder",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		parentFolderId: text("parent_folder_id"),
		position: integer("position").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("documentation_folder_parentFolderId_idx").on(table.parentFolderId),
	]
);

export const documentationFolderRelations = relations(
	documentationFolder,
	({ many, one }) => ({
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

export const documentationPage = sqliteTable(
	"documentation_page",
	{
		id: text("id").primaryKey(),
		folderId: text("folder_id"),
		title: text("title").notNull(),
		content: text("content").notNull().default(""),
		visibility: text("visibility", { enum: ["public", "private"] })
			.notNull()
			.default("private"),
		authorId: text("author_id").notNull(),
		position: integer("position").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("documentation_page_folderId_idx").on(table.folderId),
		index("documentation_page_authorId_idx").on(table.authorId),
	]
);

export const documentationPageRelations = relations(
	documentationPage,
	({ one }) => ({
		folder: one(documentationFolder, {
			fields: [documentationPage.folderId],
			references: [documentationFolder.id],
		}),
	})
);
