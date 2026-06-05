import type { cardLinkType } from "@cloudflare-agent-kanban/types";
import {
	and,
	desc,
	eq,
	inArray,
	isNotNull,
	isNull,
	ne,
	or,
	sql,
} from "drizzle-orm";
import { createDoDb } from "./db/index";
// biome-ignore lint/performance/noNamespaceImport: Whole schema import
import * as schema from "./db/schema";

export interface DOEnv {
	DB: D1Database;
}

export class ProjectDO implements DurableObject {
	db: ReturnType<typeof createDoDb>;
	projectId: string;
	ctx: DurableObjectState;
	env: DOEnv;

	constructor(ctx: DurableObjectState, env: DOEnv) {
		this.ctx = ctx;
		this.env = env;
		this.projectId = "";
		this.db = createDoDb(ctx.storage);

		ctx.blockConcurrencyWhile(async () => {
			await this._migrate();
		});
	}

	_prefixId(id: string) {
		return `${this.projectId}:${id}`;
	}

	_migrate() {
		const { sql } = this.ctx.storage;
		sql.exec(`CREATE TABLE IF NOT EXISTS "board" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"visibility" text DEFAULT 'private' NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	"updated_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
`);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "board_ownerId_idx" ON "board" ("owner_id");`
		);
		sql.exec(`CREATE TABLE IF NOT EXISTS "board_member" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
`);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "board_member_boardId_idx" ON "board_member" ("board_id");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "board_member_userId_idx" ON "board_member" ("user_id");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "board_member_unique_idx" ON "board_member" ("board_id","user_id");`
		);
		sql.exec(`CREATE TABLE IF NOT EXISTS "card" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"card_number" integer NOT NULL,
	"column_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"acceptance_criteria" text,
	"position" integer DEFAULT 0 NOT NULL,
	"assignee_id" text,
	"agent_trigger_url" text,
	"created_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	"updated_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	"archived_date" integer
);
`);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_columnId_idx" ON "card" ("column_id");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_position_idx" ON "card" ("column_id","position");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_assigneeId_idx" ON "card" ("assignee_id");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_boardId_idx" ON "card" ("board_id");`
		);
		sql.exec(`CREATE TABLE IF NOT EXISTS "card_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
`);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_comment_cardId_idx" ON "card_comment" ("card_id");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_comment_createdAt_idx" ON "card_comment" ("created_at");`
		);
		sql.exec(`CREATE TABLE IF NOT EXISTS "card_history" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"field_name" text,
	"old_value" text,
	"new_value" text,
	"created_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
`);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_history_cardId_idx" ON "card_history" ("card_id");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_history_createdAt_idx" ON "card_history" ("created_at");`
		);
		sql.exec(`CREATE TABLE IF NOT EXISTS "card_label" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6366f1' NOT NULL,
	"created_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
`);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_label_cardId_idx" ON "card_label" ("card_id");`
		);
		sql.exec(`CREATE TABLE IF NOT EXISTS "card_link" (
	"id" text PRIMARY KEY NOT NULL,
	"source_card_id" text NOT NULL,
	"target_card_id" text NOT NULL,
	"link_type" text NOT NULL,
	"created_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
`);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_link_sourceCardId_idx" ON "card_link" ("source_card_id");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_link_targetCardId_idx" ON "card_link" ("target_card_id");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "card_link_card_pair_idx" ON "card_link" ("source_card_id","target_card_id");`
		);
		sql.exec(`CREATE TABLE IF NOT EXISTS "column" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	"updated_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
`);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "column_boardId_idx" ON "column" ("board_id");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "column_position_idx" ON "column" ("board_id","position");`
		);
		sql.exec(`CREATE TABLE IF NOT EXISTS "documentation_folder" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_folder_id" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	"updated_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
`);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "documentation_folder_parentFolderId_idx" ON "documentation_folder" ("parent_folder_id");`
		);
		sql.exec(`CREATE TABLE IF NOT EXISTS "documentation_page" (
	"id" text PRIMARY KEY NOT NULL,
	"folder_id" text,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"author_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	"updated_at" integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
`);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "documentation_page_folderId_idx" ON "documentation_page" ("folder_id");`
		);
		sql.exec(
			`CREATE INDEX IF NOT EXISTS "documentation_page_authorId_idx" ON "documentation_page" ("author_id");`
		);
	}

	async fetch(request: Request): Promise<Response> {
		this.projectId =
			request.headers.get("X-Project-Id") ??
			(this.ctx.id as { name?: string }).name ??
			"";

		try {
			const body = (await request.json()) as {
				method: string;
				params: Record<string, unknown>;
			};
			const { method, params } = body;

			switch (method) {
				case "getBoards":
					return this._ok(await this.getBoards());
				case "getBoard":
					return this._ok(await this.getBoard(params as { boardId: string }));
				case "createBoard":
					return this._ok(
						await this.createBoard(params as unknown as CreateBoardParams)
					);
				case "updateBoard":
					return this._ok(
						await this.updateBoard(params as unknown as UpdateBoardParams)
					);
				case "deleteBoard":
					return this._ok(
						await this.deleteBoard(params as unknown as DeleteBoardParams)
					);

				case "getColumns":
					return this._ok(await this.getColumns(params as { boardId: string }));
				case "getColumn":
					return this._ok(await this.getColumn(params as { columnId: string }));
				case "createColumn":
					return this._ok(
						await this.createColumn(params as unknown as CreateColumnParams)
					);
				case "updateColumn":
					return this._ok(
						await this.updateColumn(params as unknown as UpdateColumnParams)
					);
				case "deleteColumn":
					return this._ok(
						await this.deleteColumn(params as unknown as DeleteColumnParams)
					);
				case "reorderColumns":
					return this._ok(
						await this.reorderColumns(params as unknown as ReorderColumnsParams)
					);

				case "getCardsByBoardId":
					return this._ok(
						await this.getCardsByBoardId(params as { boardId: string })
					);
				case "getCardsByColumnId":
					return this._ok(
						await this.getCardsByColumnId(params as { columnId: string })
					);
				case "getCard":
					return this._ok(await this.getCard(params as { cardId: string }));
				case "createCard":
					return this._ok(
						await this.createCard(params as unknown as CreateCardParams)
					);
				case "updateCard":
					return this._ok(
						await this.updateCard(params as unknown as UpdateCardParams)
					);
				case "deleteCard":
					return this._ok(
						await this.deleteCard(params as unknown as DeleteCardParams)
					);
				case "moveCard":
					return this._ok(
						await this.moveCard(params as unknown as MoveCardParams)
					);
				case "searchCards":
					return this._ok(
						await this.searchCards(params as unknown as SearchCardsParams)
					);

				case "getArchivedCards":
					return this._ok(
						await this.getArchivedCards(params as { boardId: string })
					);
				case "archiveCards":
					return this._ok(
						await this.archiveCards(params as unknown as ArchiveCardsParams)
					);
				case "archiveByColumn":
					return this._ok(
						await this.archiveByColumn(params as { columnId: string })
					);
				case "unarchiveCards":
					return this._ok(
						await this.unarchiveCards(params as unknown as UnarchiveCardsParams)
					);

				case "getComments":
					return this._ok(await this.getComments(params as { cardId: string }));
				case "createComment":
					return this._ok(
						await this.createComment(params as unknown as CreateCommentParams)
					);
				case "deleteComment":
					return this._ok(
						await this.deleteComment(params as { commentId: string })
					);

				case "getHistory":
					return this._ok(await this.getHistory(params as { cardId: string }));

				case "getLinks":
					return this._ok(await this.getLinks(params as { cardId: string }));
				case "createLink":
					return this._ok(
						await this.createLink(params as unknown as CreateLinkParams)
					);
				case "deleteLink":
					return this._ok(
						await this.deleteLink(params as unknown as DeleteLinkParams)
					);

				case "getLabels":
					return this._ok(await this.getLabels(params as { cardId: string }));

				case "getFolders":
					return this._ok(await this.getFolders());
				case "createFolder":
					return this._ok(
						await this.createFolder(params as unknown as CreateFolderParams)
					);
				case "updateFolder":
					return this._ok(
						await this.updateFolder(params as unknown as UpdateFolderParams)
					);
				case "deleteFolder":
					return this._ok(
						await this.deleteFolder(params as { folderId: string })
					);
				case "getPages":
					return this._ok(await this.getPages());
				case "getPage":
					return this._ok(await this.getPage(params as { pageId: string }));
				case "createPage":
					return this._ok(
						await this.createPage(params as unknown as CreatePageParams)
					);
				case "updatePage":
					return this._ok(
						await this.updatePage(params as unknown as UpdatePageParams)
					);
				case "deletePage":
					return this._ok(await this.deletePage(params as { pageId: string }));

				default:
					return this._fail(`Unknown method: ${method}`, 404);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : "Internal error";
			return this._fail(message, 500);
		}
	}

	_ok(data: unknown): Response {
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	_fail(message: string, status = 400): Response {
		return new Response(JSON.stringify({ message }), {
			status,
			headers: { "Content-Type": "application/json" },
		});
	}

	async _getUser(userId: string) {
		try {
			const row = (await this.env.DB.prepare(
				"SELECT id, name, image, email FROM user WHERE id = ?"
			)
				.bind(userId)
				.first()) as {
				id: string;
				name: string;
				image: string | null;
				email: string;
			} | null;
			return row ?? null;
		} catch {
			return null;
		}
	}

	async _getUserName(userId: string) {
		try {
			const row = (await this.env.DB.prepare(
				"SELECT name FROM user WHERE id = ?"
			)
				.bind(userId)
				.first()) as { name: string } | null;
			return row?.name ?? "Unknown";
		} catch {
			return "Unknown";
		}
	}

	async _getUserByEmail(email: string) {
		try {
			const row = (await this.env.DB.prepare(
				"SELECT id, name, image FROM user WHERE email = ?"
			)
				.bind(email)
				.first()) as {
				id: string;
				name: string;
				image: string | null;
			} | null;
			return row ?? null;
		} catch {
			return null;
		}
	}

	async _getUserByUsername(username: string) {
		try {
			const row = (await this.env.DB.prepare(
				"SELECT id, name FROM user WHERE username = ?"
			)
				.bind(username)
				.first()) as { id: string; name: string } | null;
			return row ?? null;
		} catch {
			return null;
		}
	}

	async _insertNotification(
		userId: string,
		type: string,
		sourceId: string,
		sourceType: string
	) {
		try {
			await this.env.DB.prepare(
				"INSERT INTO notification (id, user_id, type, source_id, source_type, read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)"
			)
				.bind(userId, type, sourceId, sourceType, Date.now())
				.run();
		} catch {
			// silently fail
		}
	}

	// ========== Boards ==========

	async getBoards() {
		const boards = await this.db.query.board.findMany({
			orderBy: schema.board.createdAt,
		});
		return boards;
	}

	async getBoard(params: { boardId: string }) {
		const boardData = await this.db.query.board.findFirst({
			where: eq(schema.board.id, params.boardId),
		});
		if (!boardData) {
			throw new Error("Board not found");
		}
		return boardData;
	}

	async createBoard(params: CreateBoardParams) {
		const ts = new Date();
		const rows = await this.db
			.insert(schema.board)
			.values({
				id: params.boardId,
				name: params.name,
				description: params.description ?? null,
				visibility: (params.visibility ?? "private") as "private" | "public",
				ownerId: params.ownerId,
				createdAt: ts,
				updatedAt: ts,
			})
			.returning();
		return rows.find(Boolean);
	}

	async updateBoard(params: UpdateBoardParams) {
		const updates: Partial<typeof schema.board.$inferInsert> = {};
		if (params.name !== undefined) {
			updates.name = params.name;
		}
		if (params.description !== undefined) {
			updates.description = params.description;
		}
		if (params.visibility !== undefined) {
			updates.visibility = params.visibility as "public" | "private";
		}
		updates.updatedAt = new Date();

		await this.db
			.update(schema.board)
			.set(updates)
			.where(eq(schema.board.id, params.boardId));

		const boardData = await this.db.query.board.findFirst({
			where: eq(schema.board.id, params.boardId),
		});
		return boardData;
	}

	async deleteBoard(params: DeleteBoardParams) {
		const cardsInBoard = await this.db
			.select({ id: schema.card.id })
			.from(schema.card)
			.where(eq(schema.card.boardId, params.boardId));

		const cardIds = cardsInBoard.map((c) => c.id);

		if (cardIds.length > 0) {
			await this.db
				.delete(schema.cardLink)
				.where(
					or(
						inArray(schema.cardLink.sourceCardId, cardIds),
						inArray(schema.cardLink.targetCardId, cardIds)
					)
				);
			await this.db
				.delete(schema.cardHistory)
				.where(inArray(schema.cardHistory.cardId, cardIds));
			await this.db
				.delete(schema.cardComment)
				.where(inArray(schema.cardComment.cardId, cardIds));
			await this.db
				.delete(schema.cardLabel)
				.where(inArray(schema.cardLabel.cardId, cardIds));
			await this.db
				.delete(schema.card)
				.where(eq(schema.card.boardId, params.boardId));
		}

		await this.db
			.delete(schema.column)
			.where(eq(schema.column.boardId, params.boardId));
		await this.db
			.delete(schema.boardMember)
			.where(eq(schema.boardMember.boardId, params.boardId));
		await this.db
			.delete(schema.board)
			.where(eq(schema.board.id, params.boardId));

		return { success: true };
	}

	// ========== Columns ==========

	async getColumns(params: { boardId: string }) {
		const columns = await this.db.query.column.findMany({
			where: eq(schema.column.boardId, params.boardId),
			orderBy: schema.column.position,
		});
		return columns;
	}

	async getColumn(params: { columnId: string }) {
		const col = await this.db.query.column.findFirst({
			where: eq(schema.column.id, params.columnId),
		});
		if (!col) {
			throw new Error("Column not found");
		}
		return col;
	}

	async createColumn(params: CreateColumnParams) {
		const colId = this._prefixId(params.columnId);
		const existing = await this.db.query.column.findFirst({
			columns: { position: true },
			where: eq(schema.column.boardId, params.boardId),
			orderBy: desc(schema.column.position),
		});

		const maxPos = existing;
		const ts = new Date();
		const rows = await this.db
			.insert(schema.column)
			.values({
				id: colId,
				boardId: params.boardId,
				name: params.name,
				position: (maxPos?.position ?? -1) + 1,
				createdAt: ts,
				updatedAt: ts,
			})
			.returning();
		return rows.find(Boolean);
	}

	async updateColumn(params: UpdateColumnParams) {
		const col = await this.getColumn({ columnId: params.columnId });
		if (col.boardId !== params.boardId) {
			throw new Error("Column not found");
		}

		const updates: Partial<typeof schema.column.$inferInsert> = {};
		if (params.name !== undefined) {
			updates.name = params.name;
		}
		if (params.description !== undefined) {
			updates.description = params.description;
		}
		if (params.position !== undefined) {
			updates.position = params.position;
		}
		updates.updatedAt = new Date();

		await this.db
			.update(schema.column)
			.set(updates)
			.where(eq(schema.column.id, params.columnId));

		const updatedCol = await this.db.query.column.findFirst({
			where: eq(schema.column.id, params.columnId),
		});
		return updatedCol;
	}

	async deleteColumn(params: DeleteColumnParams) {
		const col = await this.getColumn({ columnId: params.columnId });
		if (col.boardId !== params.boardId) {
			throw new Error("Column not found");
		}

		const cardsInColumn = await this.db
			.select({ id: schema.card.id })
			.from(schema.card)
			.where(eq(schema.card.columnId, params.columnId));

		const cardIds = cardsInColumn.map((c) => c.id);

		if (cardIds.length > 0) {
			await this.db
				.delete(schema.cardLink)
				.where(
					or(
						inArray(schema.cardLink.sourceCardId, cardIds),
						inArray(schema.cardLink.targetCardId, cardIds)
					)
				);
			await this.db
				.delete(schema.cardHistory)
				.where(inArray(schema.cardHistory.cardId, cardIds));
			await this.db
				.delete(schema.cardComment)
				.where(inArray(schema.cardComment.cardId, cardIds));
			await this.db
				.delete(schema.cardLabel)
				.where(inArray(schema.cardLabel.cardId, cardIds));
			await this.db.delete(schema.card).where(inArray(schema.card.id, cardIds));
		}

		await this.db
			.delete(schema.column)
			.where(eq(schema.column.id, params.columnId));

		return { success: true };
	}

	async reorderColumns(params: ReorderColumnsParams) {
		const ts = new Date();
		for (const col of params.columns) {
			await this.db
				.update(schema.column)
				.set({ position: col.position, updatedAt: ts })
				.where(
					and(
						eq(schema.column.id, col.id),
						eq(schema.column.boardId, params.boardId)
					)
				);
		}
		return { success: true };
	}

	// ========== Cards ==========

	async getCardsByBoardId(params: { boardId: string }) {
		const columns = await this.db
			.select()
			.from(schema.column)
			.where(eq(schema.column.boardId, params.boardId))
			.orderBy(schema.column.position);

		const result: Record<string, unknown[]> = {};

		for (const col of columns) {
			const cards = await this.db
				.select({
					id: schema.card.id,
					cardNumber: schema.card.cardNumber,
					columnId: schema.card.columnId,
					title: schema.card.title,
					type: schema.card.type,
					position: schema.card.position,
					assigneeId: schema.card.assigneeId,
					agentTriggerUrl: schema.card.agentTriggerUrl,
					cardCommentCount: sql<number>`(SELECT COUNT(*) FROM card_comment WHERE card_id = card.id)`,
					cardLinkCount: sql<number>`(SELECT COUNT(*) FROM card_link WHERE source_card_id = card.id)`,
				})
				.from(schema.card)
				.where(
					and(
						eq(schema.card.columnId, col.id),
						isNull(schema.card.archivedDate)
					)
				)
				.orderBy(schema.card.position);

			result[col.id] = cards;
		}

		return result;
	}

	async getCardsByColumnId(params: { columnId: string }) {
		const rows = await this.db.query.card.findMany({
			where: and(
				eq(schema.card.columnId, params.columnId),
				isNull(schema.card.archivedDate)
			),
			orderBy: schema.card.position,
		});
		return rows;
	}

	async getCard(params: { cardId: string }) {
		const card = await this.db.query.card.findFirst({
			where: eq(schema.card.id, params.cardId),
		});
		if (!card) {
			throw new Error("Card not found");
		}

		const labels = await this.db.query.cardLabel.findMany({
			where: eq(schema.cardLabel.cardId, params.cardId),
		});

		return { ...card, labels };
	}

	async getCardNumber(params: { columnId: string; boardId: string }) {
		const existing = await this.db.query.card.findFirst({
			columns: { cardNumber: true },
			where: eq(schema.card.boardId, params.boardId),
			orderBy: desc(schema.card.cardNumber),
		});
		return (existing?.cardNumber ?? 0) + 1;
	}

	async createCard(params: CreateCardParams) {
		const col = await this.getColumn({ columnId: params.columnId });

		const maxPositionExisting = await this.db.query.card.findFirst({
			columns: { position: true },
			where: eq(schema.card.columnId, params.columnId),
			orderBy: desc(schema.card.position),
		});

		const maxCardNumberExisting = await this.db.query.card.findFirst({
			columns: { cardNumber: true },
			where: eq(schema.card.boardId, col.boardId),
			orderBy: desc(schema.card.cardNumber),
		});

		const rawId = params.cardId ?? crypto.randomUUID();
		const id = this._prefixId(rawId);
		const ts = new Date();

		await this.db.insert(schema.card).values({
			id,
			boardId: col.boardId,
			cardNumber: (maxCardNumberExisting?.cardNumber ?? 0) + 1,
			columnId: params.columnId,
			title: params.title,
			type: params.type as "epic" | "feature" | "user_story" | "bug" | "task",
			description: params.description ?? null,
			acceptanceCriteria: params.acceptanceCriteria ?? null,
			position: (maxPositionExisting?.position ?? -1) + 1,
			assigneeId: params.assigneeId ?? null,
			createdAt: ts,
			updatedAt: ts,
		});

		await this._logCardChange(
			id,
			params.userId,
			"CREATE",
			null,
			null,
			JSON.stringify({
				title: params.title,
				type: params.type,
				description: params.description,
				acceptanceCriteria: params.acceptanceCriteria,
			})
		);

		const card = await this.db.query.card.findFirst({
			where: eq(schema.card.id, id),
		});
		return card;
	}

	async updateCard(params: UpdateCardParams) {
		const existingCard = await this.db.query.card.findFirst({
			where: eq(schema.card.id, params.cardId),
		});
		if (!existingCard) {
			throw new Error("Card not found");
		}

		const updates: Partial<typeof schema.card.$inferInsert> = {};
		const logEntries: Array<{
			field: string;
			oldVal: string;
			newVal: string;
		}> = [];

		if (params.title !== undefined) {
			updates.title = params.title;
			logEntries.push({
				field: "title",
				oldVal: String(existingCard.title ?? ""),
				newVal: params.title,
			});
		}
		if (params.type !== undefined) {
			updates.type = params.type as
				| "epic"
				| "feature"
				| "user_story"
				| "bug"
				| "task";
		}
		if (params.description !== undefined) {
			updates.description = params.description;
			logEntries.push({
				field: "description",
				oldVal: String(existingCard.description ?? ""),
				newVal: params.description,
			});
		}
		if (params.acceptanceCriteria !== undefined) {
			updates.acceptanceCriteria = params.acceptanceCriteria;
			logEntries.push({
				field: "acceptanceCriteria",
				oldVal: String(existingCard.acceptanceCriteria ?? ""),
				newVal: params.acceptanceCriteria,
			});
		}
		if (params.position !== undefined) {
			updates.position = params.position;
		}
		if (params.assigneeId !== undefined) {
			updates.assigneeId = params.assigneeId;
			logEntries.push({
				field: "assigneeId",
				oldVal: String(existingCard.assigneeId ?? ""),
				newVal: params.assigneeId ?? "",
			});
		}
		if (params.agentTriggerUrl !== undefined) {
			updates.agentTriggerUrl = params.agentTriggerUrl;
		}

		updates.updatedAt = new Date();

		await this.db
			.update(schema.card)
			.set(updates)
			.where(eq(schema.card.id, params.cardId));

		for (const entry of logEntries) {
			await this._logCardChange(
				params.cardId,
				params.userId,
				"UPDATE",
				entry.field,
				entry.oldVal,
				entry.newVal
			);
		}

		const updatedCard = await this.db.query.card.findFirst({
			where: eq(schema.card.id, params.cardId),
		});
		return updatedCard;
	}

	async deleteCard(params: DeleteCardParams) {
		const existingCard = await this.db.query.card.findFirst({
			where: eq(schema.card.id, params.cardId),
		});
		if (!existingCard) {
			throw new Error("Card not found");
		}

		await this._logCardChange(
			params.cardId,
			params.userId,
			"DELETE",
			null,
			JSON.stringify(existingCard),
			null
		);

		await this.db
			.delete(schema.cardLink)
			.where(
				or(
					eq(schema.cardLink.sourceCardId, params.cardId),
					eq(schema.cardLink.targetCardId, params.cardId)
				)
			);
		await this.db
			.delete(schema.cardHistory)
			.where(eq(schema.cardHistory.cardId, params.cardId));
		await this.db
			.delete(schema.cardComment)
			.where(eq(schema.cardComment.cardId, params.cardId));
		await this.db
			.delete(schema.cardLabel)
			.where(eq(schema.cardLabel.cardId, params.cardId));
		await this.db.delete(schema.card).where(eq(schema.card.id, params.cardId));

		return { success: true };
	}

	async moveCard(params: MoveCardParams) {
		const existingCard = await this.db.query.card.findFirst({
			where: eq(schema.card.id, params.cardId),
		});
		if (!existingCard) {
			throw new Error("Card not found");
		}

		if (existingCard.columnId !== params.newColumnId) {
			await this._logCardChange(
				params.cardId,
				params.userId,
				"MOVE",
				"columnId",
				existingCard.columnId,
				params.newColumnId
			);
		}

		await this.db
			.update(schema.card)
			.set({
				columnId: params.newColumnId,
				position: params.newPosition,
				updatedAt: new Date(),
			})
			.where(eq(schema.card.id, params.cardId));

		const updatedCard = await this.db.query.card.findFirst({
			where: eq(schema.card.id, params.cardId),
		});
		return updatedCard;
	}

	async searchCards(params: SearchCardsParams) {
		const queryNum = Number.parseInt(params.query, 10);

		if (!Number.isNaN(queryNum)) {
			const rows = await this.db
				.select({
					id: schema.card.id,
					cardNumber: schema.card.cardNumber,
					title: schema.card.title,
					type: schema.card.type,
				})
				.from(schema.card)
				.where(
					and(
						eq(schema.card.boardId, params.boardId),
						eq(schema.card.cardNumber, queryNum),
						params.excludeCardId
							? ne(schema.card.id, params.excludeCardId)
							: undefined
					)
				);
			return rows;
		}

		if (params.query.trim().length > 0) {
			const likeQuery = `%${params.query.toLowerCase()}%`;
			const rows = await this.db
				.select({
					id: schema.card.id,
					cardNumber: schema.card.cardNumber,
					title: schema.card.title,
					type: schema.card.type,
				})
				.from(schema.card)
				.where(
					and(
						eq(schema.card.boardId, params.boardId),
						sql`LOWER(${schema.card.title}) LIKE ${likeQuery}`,
						params.excludeCardId
							? ne(schema.card.id, params.excludeCardId)
							: undefined
					)
				);
			return rows;
		}

		return [];
	}

	// ========== Archive ==========

	async archiveCards(params: ArchiveCardsParams) {
		const existingCard = await this.db.query.card.findFirst({
			where: eq(schema.card.id, params.cardId),
		});
		if (!existingCard) {
			throw new Error("Card not found");
		}

		const ts = new Date();
		await this.db
			.update(schema.card)
			.set({ archivedDate: ts, updatedAt: ts })
			.where(eq(schema.card.id, params.cardId));

		await this._logCardChange(
			params.cardId,
			params.userId,
			"ARCHIVE",
			null,
			null,
			JSON.stringify({ title: existingCard.title })
		);

		const updatedCard = await this.db.query.card.findFirst({
			where: eq(schema.card.id, params.cardId),
		});
		return updatedCard;
	}

	async archiveByColumn(params: { columnId: string }) {
		const col = await this.db.query.column.findFirst({
			where: eq(schema.column.id, params.columnId),
		});
		if (!col) {
			throw new Error("Column not found");
		}

		const cardsToArchive = await this.db
			.select()
			.from(schema.card)
			.where(
				and(
					eq(schema.card.columnId, params.columnId),
					isNull(schema.card.archivedDate)
				)
			);

		if (cardsToArchive.length === 0) {
			return { success: true, archivedCount: 0 };
		}

		const ts = new Date();
		await this.db
			.update(schema.card)
			.set({ archivedDate: ts, updatedAt: ts })
			.where(
				and(
					eq(schema.card.columnId, params.columnId),
					isNull(schema.card.archivedDate)
				)
			);

		for (const c of cardsToArchive) {
			await this._logCardChange(
				c.id,
				c.assigneeId,
				"ARCHIVE",
				null,
				null,
				JSON.stringify({ title: c.title, columnName: col.name })
			);
		}

		return { success: true, archivedCount: cardsToArchive.length };
	}

	async getArchivedCards(params: { boardId: string }) {
		const archivedCards = await this.db
			.select()
			.from(schema.card)
			.where(
				and(
					eq(schema.card.boardId, params.boardId),
					isNotNull(schema.card.archivedDate)
				)
			);

		const columnIds = [...new Set(archivedCards.map((c) => c.columnId))];
		const columns =
			columnIds.length > 0
				? await this.db
						.select({ id: schema.column.id, name: schema.column.name })
						.from(schema.column)
						.where(inArray(schema.column.id, columnIds))
				: [];

		const columnMap = new Map(columns.map((c) => [c.id, c.name]));

		return archivedCards.map((c) => ({
			...c,
			originalColumnName: columnMap.get(c.columnId) ?? "Unknown",
		}));
	}

	async unarchiveCards(params: UnarchiveCardsParams) {
		if (params.cardIds.length === 0) {
			return { success: true, unarchivedCount: 0 };
		}

		const cardsToUnarchive = await this.db
			.select()
			.from(schema.card)
			.where(inArray(schema.card.id, params.cardIds));

		if (cardsToUnarchive.length === 0) {
			throw new Error("No cards found to unarchive");
		}

		const columnIds = [...new Set(cardsToUnarchive.map((c) => c.columnId))];
		const boardIds = [...new Set(cardsToUnarchive.map((c) => c.boardId))];

		const columns =
			columnIds.length > 0
				? await this.db
						.select({ id: schema.column.id, name: schema.column.name })
						.from(schema.column)
						.where(inArray(schema.column.id, columnIds))
				: [];

		const columnMap = new Map(columns.map((c) => [c.id, c.name]));

		const firstColumnMap = new Map<string, string>();
		for (const bid of boardIds) {
			const firstColRows = await this.db
				.select()
				.from(schema.column)
				.where(eq(schema.column.boardId, bid))
				.orderBy(schema.column.position)
				.limit(1);
			const first = firstColRows.find(Boolean);
			if (first) {
				firstColumnMap.set(bid, first.id);
			}
		}

		const ts = new Date();
		for (const c of cardsToUnarchive) {
			const targetColumn = columnMap.get(c.columnId);
			const targetColumnId = targetColumn
				? c.columnId
				: firstColumnMap.get(c.boardId);

			if (!targetColumnId) {
				throw new Error("No column available to unarchive card");
			}

			const isDifferentColumn = targetColumnId !== c.columnId;

			await this.db
				.update(schema.card)
				.set({ archivedDate: null, columnId: targetColumnId, updatedAt: ts })
				.where(eq(schema.card.id, c.id));

			await this._logCardChange(
				c.id,
				params.userId,
				"UNARCHIVE",
				isDifferentColumn ? "columnId" : null,
				c.columnId,
				targetColumnId
			);
		}

		return { success: true, unarchivedCount: cardsToUnarchive.length };
	}

	// ========== Comments ==========

	async getComments(params: { cardId: string }) {
		const comments = await this.db.query.cardComment.findMany({
			where: eq(schema.cardComment.cardId, params.cardId),
			orderBy: schema.cardComment.createdAt,
		});

		const commentsWithUser = await Promise.all(
			comments.map(async (comment) => {
				const userData = comment.userId
					? await this._getUser(comment.userId)
					: null;
				return { ...comment, user: userData };
			})
		);

		return commentsWithUser;
	}

	async createComment(params: CreateCommentParams) {
		const commentId = this._prefixId(crypto.randomUUID());
		await this.db.insert(schema.cardComment).values({
			id: commentId,
			cardId: params.cardId,
			userId: params.userId,
			content: params.content,
			createdAt: new Date(),
		});

		const mentionRegex = /@([a-z0-9_-]{6,30})/g;
		const mentions = params.content.match(mentionRegex);
		if (mentions) {
			const mentionedUsernames = mentions.map((m) =>
				m.substring(1).toLowerCase()
			);
			for (const username of mentionedUsernames) {
				const mentionedUser = await this._getUserByUsername(username);
				if (mentionedUser && mentionedUser.id !== params.userId) {
					await this._insertNotification(
						mentionedUser.id,
						"mention",
						commentId,
						"comment"
					);
				}
			}
		}

		const userData = await this._getUser(params.userId);
		const comment = await this.db.query.cardComment.findFirst({
			where: eq(schema.cardComment.id, commentId),
		});

		return { ...comment, user: userData };
	}

	async deleteComment(params: { commentId: string }) {
		await this.db
			.delete(schema.cardComment)
			.where(eq(schema.cardComment.id, params.commentId));
		return { success: true };
	}

	// ========== History ==========

	async getHistory(params: { cardId: string }) {
		const history = await this.db.query.cardHistory.findMany({
			where: eq(schema.cardHistory.cardId, params.cardId),
			orderBy: desc(schema.cardHistory.createdAt),
		});

		const historyWithUser = await Promise.all(
			history.map(async (entry) => {
				const userName = entry.userId
					? await this._getUserName(entry.userId)
					: "Unknown";
				return { ...entry, userName };
			})
		);

		return historyWithUser;
	}

	// ========== Links ==========

	async getLinks(params: { cardId: string }) {
		const outgoingLinks = await this.db
			.select()
			.from(schema.cardLink)
			.where(eq(schema.cardLink.sourceCardId, params.cardId));

		const incomingLinks = await this.db
			.select()
			.from(schema.cardLink)
			.where(eq(schema.cardLink.targetCardId, params.cardId));

		const targetCardIds = outgoingLinks.map((l) => l.targetCardId);
		const sourceCardIds = incomingLinks.map((l) => l.sourceCardId);
		const allRelatedCardIds = [
			...new Set([...targetCardIds, ...sourceCardIds]),
		];

		let relatedCards: Array<{
			id: string;
			cardNumber: number;
			title: string;
			type: string;
		}> = [];

		if (allRelatedCardIds.length > 0) {
			relatedCards = await this.db
				.select({
					id: schema.card.id,
					cardNumber: schema.card.cardNumber,
					title: schema.card.title,
					type: schema.card.type,
				})
				.from(schema.card)
				.where(inArray(schema.card.id, allRelatedCardIds));
		}

		const cardMap = new Map(relatedCards.map((c) => [c.id, c]));

		const outgoingWithDetails = outgoingLinks.map((link) => ({
			...link,
			targetCard: cardMap.get(link.targetCardId) ?? null,
		}));

		const incomingWithDetails = incomingLinks.map((link) => ({
			...link,
			sourceCard: cardMap.get(link.sourceCardId) ?? null,
		}));

		return { outgoing: outgoingWithDetails, incoming: incomingWithDetails };
	}

	async createLink(params: CreateLinkParams) {
		const sourceCard = await this.db.query.card.findFirst({
			where: eq(schema.card.id, params.sourceCardId),
		});
		if (!sourceCard) {
			throw new Error("Source card not found");
		}

		const targetCard = await this.db.query.card.findFirst({
			where: eq(schema.card.id, params.targetCardId),
		});
		if (!targetCard) {
			throw new Error("Target card not found");
		}

		if (sourceCard.boardId !== targetCard.boardId) {
			throw new Error("Cannot link cards from different boards");
		}

		const existingLink = await this.db.query.cardLink.findFirst({
			where: and(
				eq(schema.cardLink.sourceCardId, params.sourceCardId),
				eq(schema.cardLink.targetCardId, params.targetCardId)
			),
		});

		if (existingLink) {
			throw new Error("Link already exists");
		}

		const reverseExistingLink = await this.db.query.cardLink.findFirst({
			where: and(
				eq(schema.cardLink.sourceCardId, params.targetCardId),
				eq(schema.cardLink.targetCardId, params.sourceCardId)
			),
		});

		const reverseLinkType = getReverseLinkType(params.linkType);

		await this.db.insert(schema.cardLink).values({
			id: this._prefixId(crypto.randomUUID()),
			sourceCardId: params.sourceCardId,
			targetCardId: params.targetCardId,
			linkType: params.linkType as (typeof cardLinkType)[number],
			createdAt: new Date(),
		});

		if (!reverseExistingLink) {
			await this.db.insert(schema.cardLink).values({
				id: this._prefixId(crypto.randomUUID()),
				sourceCardId: params.targetCardId,
				targetCardId: params.sourceCardId,
				linkType: reverseLinkType as (typeof cardLinkType)[number],
				createdAt: new Date(),
			});
		}

		return { success: true };
	}

	async deleteLink(params: DeleteLinkParams) {
		const link = await this.db.query.cardLink.findFirst({
			where: eq(schema.cardLink.id, params.linkId),
		});

		if (
			!link ||
			(link.sourceCardId !== params.cardId &&
				link.targetCardId !== params.cardId)
		) {
			throw new Error("Link not found");
		}

		await this.db
			.delete(schema.cardLink)
			.where(
				or(
					and(
						eq(schema.cardLink.sourceCardId, link.sourceCardId),
						eq(schema.cardLink.targetCardId, link.targetCardId)
					),
					and(
						eq(schema.cardLink.sourceCardId, link.targetCardId),
						eq(schema.cardLink.targetCardId, link.sourceCardId)
					)
				)
			);

		return { success: true };
	}

	// ========== Labels ==========

	async getLabels(params: { cardId: string }) {
		const labels = await this.db.query.cardLabel.findMany({
			where: eq(schema.cardLabel.cardId, params.cardId),
		});
		return labels;
	}

	// ========== Documentation ==========

	async getFolders() {
		const folders = await this.db.query.documentationFolder.findMany({
			orderBy: [
				schema.documentationFolder.position,
				schema.documentationFolder.name,
			],
		});
		return folders;
	}

	async createFolder(params: CreateFolderParams) {
		const folderId = this._prefixId(params.folderId);
		const ts = new Date();
		const rows = await this.db
			.insert(schema.documentationFolder)
			.values({
				id: folderId,
				name: params.name,
				parentFolderId: params.parentFolderId ?? null,
				position: 0,
				createdAt: ts,
				updatedAt: ts,
			})
			.returning();
		return rows.find(Boolean);
	}

	async updateFolder(params: UpdateFolderParams) {
		const updates: Partial<typeof schema.documentationFolder.$inferInsert> = {};
		if (params.name !== undefined) {
			updates.name = params.name;
		}
		if (params.parentFolderId !== undefined) {
			updates.parentFolderId = params.parentFolderId;
		}
		updates.updatedAt = new Date();

		await this.db
			.update(schema.documentationFolder)
			.set(updates)
			.where(eq(schema.documentationFolder.id, params.folderId));

		const folder = await this.db.query.documentationFolder.findFirst({
			where: eq(schema.documentationFolder.id, params.folderId),
		});
		return folder;
	}

	async deleteFolder(params: { folderId: string }) {
		await this.db
			.delete(schema.documentationFolder)
			.where(eq(schema.documentationFolder.id, params.folderId));
		return { success: true };
	}

	async getPages() {
		const rows = await this.db.query.documentationPage.findMany({
			orderBy: [
				schema.documentationPage.position,
				schema.documentationPage.title,
			],
		});

		const authorIds = [
			...new Set(rows.map((p) => p.authorId).filter(Boolean)),
		] as string[];
		const userMap = new Map<
			string,
			Awaited<ReturnType<typeof this._getUser>>
		>();
		for (const uid of authorIds) {
			const userData = await this._getUser(uid);
			if (userData) {
				userMap.set(uid, userData);
			}
		}

		return rows.map((page) => ({
			...page,
			author: page.authorId ? (userMap.get(page.authorId) ?? null) : null,
		}));
	}

	async getPage(params: { pageId: string }) {
		const page = await this.db.query.documentationPage.findFirst({
			where: eq(schema.documentationPage.id, params.pageId),
		});
		if (!page) {
			throw new Error("Page not found");
		}

		let author: Awaited<ReturnType<typeof this._getUser>> = null;
		if (page.authorId) {
			author = await this._getUser(page.authorId);
		}

		return { ...page, author };
	}

	async createPage(params: CreatePageParams) {
		const pageId = this._prefixId(params.pageId);
		const ts = new Date();
		const rows = await this.db
			.insert(schema.documentationPage)
			.values({
				id: pageId,
				title: params.title,
				content: params.content ?? "",
				folderId: params.folderId ?? null,
				visibility: (params.visibility ?? "private") as "public" | "private",
				authorId: params.userId,
				position: 0,
				createdAt: ts,
				updatedAt: ts,
			})
			.returning();
		return rows.find(Boolean);
	}

	async updatePage(params: UpdatePageParams) {
		const updates: Partial<typeof schema.documentationPage.$inferInsert> = {};
		if (params.title !== undefined) {
			updates.title = params.title;
		}
		if (params.content !== undefined) {
			updates.content = params.content;
		}
		if (params.folderId !== undefined) {
			updates.folderId = params.folderId;
		}
		if (params.visibility !== undefined) {
			updates.visibility = params.visibility as "public" | "private";
		}
		updates.updatedAt = new Date();

		await this.db
			.update(schema.documentationPage)
			.set(updates)
			.where(eq(schema.documentationPage.id, params.pageId));

		const page = await this.db.query.documentationPage.findFirst({
			where: eq(schema.documentationPage.id, params.pageId),
		});
		return page;
	}

	async deletePage(params: { pageId: string }) {
		await this.db
			.delete(schema.documentationPage)
			.where(eq(schema.documentationPage.id, params.pageId));
		return { success: true };
	}

	// ========== Helpers ==========

	async _logCardChange(
		cardId: string,
		userId: string | null,
		action: string,
		fieldName: string | null,
		oldValue: string | null,
		newValue: string | null
	) {
		try {
			await this.db.insert(schema.cardHistory).values({
				id: this._prefixId(crypto.randomUUID()),
				cardId,
				userId,
				action,
				fieldName,
				oldValue,
				newValue,
				createdAt: new Date(),
			});
		} catch {
			// silently fail
		}
	}
}

function getReverseLinkType(linkType: string): string {
	const reverseMap: Record<string, string> = {
		parent_of: "child_of",
		child_of: "parent_of",
		blocked_by: "blocks",
		blocks: "blocked_by",
		depends_on: "depends_on",
		relates_to: "relates_to",
		duplicates: "duplicates",
		follows: "follows",
		part_of: "implements",
		implements: "part_of",
	};
	return reverseMap[linkType] ?? linkType;
}

// ========== Param Types ==========

interface CreateBoardParams {
	boardId: string;
	description?: string;
	name: string;
	ownerId: string;
	visibility?: string;
}

interface UpdateBoardParams {
	boardId: string;
	description?: string;
	name?: string;
	userId: string;
	visibility?: string;
}

interface DeleteBoardParams {
	boardId: string;
	userId: string;
}

interface CreateColumnParams {
	boardId: string;
	columnId: string;
	name: string;
	userId: string;
}

interface UpdateColumnParams {
	boardId: string;
	columnId: string;
	description?: string;
	name?: string;
	position?: number;
	userId: string;
}

interface DeleteColumnParams {
	boardId: string;
	columnId: string;
	userId: string;
}

interface ReorderColumnsParams {
	boardId: string;
	columns: Array<{ id: string; position: number }>;
	userId: string;
}

interface CreateCardParams {
	acceptanceCriteria?: string;
	assigneeId?: string;
	cardId?: string;
	columnId: string;
	description?: string;
	title: string;
	type: string;
	userId: string;
}

interface UpdateCardParams {
	acceptanceCriteria?: string;
	agentTriggerUrl?: string;
	assigneeId?: string;
	cardId: string;
	description?: string;
	position?: number;
	title?: string;
	type?: string;
	userId: string;
}

interface DeleteCardParams {
	cardId: string;
	userId: string;
}

interface MoveCardParams {
	cardId: string;
	newColumnId: string;
	newPosition: number;
	userId: string;
}

interface SearchCardsParams {
	boardId: string;
	excludeCardId?: string;
	query: string;
	userId: string;
}

interface ArchiveCardsParams {
	cardId: string;
	userId: string;
}

interface UnarchiveCardsParams {
	cardIds: string[];
	userId: string;
}

interface CreateCommentParams {
	cardId: string;
	content: string;
	userId: string;
}

interface CreateLinkParams {
	linkType: string;
	sourceCardId: string;
	targetCardId: string;
	userId: string;
}

interface DeleteLinkParams {
	cardId: string;
	linkId: string;
	userId: string;
}

interface CreateFolderParams {
	folderId: string;
	name: string;
	parentFolderId?: string | null;
	userId: string;
}

interface UpdateFolderParams {
	folderId: string;
	name?: string;
	parentFolderId?: string | null;
	userId: string;
}

interface CreatePageParams {
	content?: string;
	folderId?: string | null;
	pageId: string;
	title: string;
	userId: string;
	visibility?: string;
}

interface UpdatePageParams {
	content?: string;
	folderId?: string | null;
	pageId: string;
	title?: string;
	userId: string;
	visibility?: string;
}
