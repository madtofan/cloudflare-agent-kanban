import { db } from "@cloudflare-agent-kanban/db";
import type { user } from "@cloudflare-agent-kanban/db/schema/auth";
import {
	notification,
	user as userTable,
} from "@cloudflare-agent-kanban/db/schema/auth";
import {
	board,
	type CardLinkType,
	card,
	cardComment,
	cardHistory,
	cardLabel,
	cardLink,
	cardLinkType,
	column,
} from "@cloudflare-agent-kanban/db/schema/kanban";
import {
	asc,
	desc,
	eq,
	type InferSelectModel,
	inArray,
	sql,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";
import { protectedProcedure } from "../index";
import { getBoardAccess } from "../utils";
import { requireEditAccess } from "./board";

const boardIdSchema = z.object({ boardId: z.string() });
const columnIdSchema = z.object({ columnId: z.string() });
const cardIdSchema = z.object({ cardId: z.string() });

function getReverseLinkType(linkType: string): string {
	const reverseMap: Record<CardLinkType, string> = {
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
	return reverseMap[linkType as CardLinkType] ?? linkType;
}

export type Card = InferSelectModel<typeof card>;
export type User = InferSelectModel<typeof user>;
export type CardHistory = InferSelectModel<typeof cardHistory>;

async function logCardChange(
	cardId: string,
	userId: string,
	action: "CREATE" | "UPDATE" | "DELETE" | "MOVE",
	fieldName: string | null | undefined,
	oldValue: string | null | undefined,
	newValue: string | null | undefined
) {
	await db.insert(cardHistory).values({
		id: nanoid(),
		cardId,
		userId,
		action,
		fieldName: fieldName ?? null,
		oldValue: oldValue ?? null,
		newValue: newValue ?? null,
		createdAt: new Date(),
	});
}

export const cardRouter = {
	getByColumnId: protectedProcedure
		.route({
			method: "GET",
			path: "/api/column/{columnId}/card",
			summary: "",
			tags: ["Card"],
		})
		.input(columnIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const columnData = await db.query.column.findFirst({
				where: eq(column.id, input.columnId),
			});

			if (!columnData) {
				throw new Error("Column not found");
			}

			const access = await getBoardAccess(columnData.boardId, userId);

			if (access === "none") {
				throw new Error("Board not found");
			}

			const cards = await db.query.card.findMany({
				where: eq(card.columnId, input.columnId),
				orderBy: asc(card.position),
			});

			return cards;
		}),

	getByBoardId: protectedProcedure
		.route({
			method: "GET",
			path: "/api/board/{boardId}/card",
			summary: "",
			tags: ["Card"],
		})
		.input(boardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getBoardAccess(input.boardId, userId);

			if (access === "none") {
				throw new Error("Board not found");
			}

			const cards = await db.query.board.findFirst({
				where: eq(board.id, input.boardId),
				columns: {
					id: true,
				},
				with: {
					members: {
						columns: {
							userId: true,
						},
					},
					columns: {
						columns: {
							id: true,
						},
						with: {
							cards: {
								columns: {
									id: true,
									cardNumber: true,
									columnId: true,
									title: true,
									type: true,
									description: true,
									acceptanceCriteria: true,
									position: true,
									agentTriggerUrl: true,
									createdAt: true,
									updatedAt: true,
								},
								with: {
									assignee: {
										columns: {
											id: true,
											name: true,
										},
									},
								},
							},
						},
					},
				},
			});

			const isMember =
				access === "owner" || access === "admin" || access === "member";

			if (isMember) {
				return cards?.columns.reduce<
					Record<string, Partial<Card & { assignee: Partial<User> | null }>[]>
				>((acc, column) => {
					acc[column.id] = column.cards;
					return acc;
				}, {});
			}

			return cards?.columns.reduce<
				Record<string, Partial<Card & { assignee: Partial<User> | null }>[]>
			>((acc, column) => {
				acc[column.id] = column.cards.map<
					Partial<Card & { assignee: Partial<User> | null }>
				>((card) => ({
					id: card.id,
					cardNumber: card.cardNumber,
					columnId: card.columnId,
					title: card.title,
					type: card.type,
					description: card.description,
					acceptanceCriteria: card.acceptanceCriteria,
					position: card.position,
					assignee: card.assignee,
					createdAt: card.createdAt,
					updatedAt: card.updatedAt,
				}));
				return acc;
			}, {});
		}),

	getById: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}",
			summary: "",
			tags: ["Card"],
		})
		.input(cardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
				with: {
					assignee: {
						columns: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});

			if (!cardData) {
				throw new Error("Card not found");
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				throw new Error("Column not found");
			}
			const access = await getBoardAccess(columnData.boardId, userId);

			if (access === "none") {
				throw new Error("Board not found");
			}

			const labels = await db.query.cardLabel.findMany({
				where: eq(cardLabel.cardId, input.cardId),
			});

			return { ...cardData, labels };
		}),

	getHistory: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/history/{cardId}",
			summary: "",
			tags: ["Card"],
		})
		.input(cardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
			});

			if (!cardData) {
				throw new Error("Card not found");
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				throw new Error("Column not found");
			}
			const access = await getBoardAccess(columnData.boardId, userId);

			if (access === "none") {
				throw new Error("Board not found");
			}

			const history = await db.query.cardHistory.findMany({
				where: eq(cardHistory.cardId, input.cardId),
				orderBy: desc(cardHistory.createdAt),
			});

			const historyWithUser = await Promise.all(
				history.map(async (entry) => {
					let userName = "Unknown";
					if (entry.userId) {
						const userData = await db.query.user.findFirst({
							where: eq(userTable.id, entry.userId),
							columns: { name: true },
						});
						userName = userData?.name ?? "Unknown";
					}
					return { ...entry, userName };
				})
			);

			return historyWithUser;
		}),

	getComments: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}/comment",
			summary: "",
			tags: ["Card"],
		})
		.input(cardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
			});

			if (!cardData) {
				throw new Error("Card not found");
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				throw new Error("Column not found");
			}
			const access = await getBoardAccess(columnData.boardId, userId);

			if (access === "none") {
				throw new Error("Board not found");
			}

			const comments = await db.query.cardComment.findMany({
				where: eq(cardComment.cardId, input.cardId),
				orderBy: asc(cardComment.createdAt),
			});

			const commentsWithUser = await Promise.all(
				comments.map(async (comment) => {
					const userData = await db.query.user.findFirst({
						where: eq(userTable.id, comment.userId),
						columns: { id: true, name: true, image: true, username: true },
					});
					return { ...comment, user: userData };
				})
			);

			return commentsWithUser;
		}),

	getCommentCount: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}/comment/count",
			summary: "",
			tags: ["Card"],
		})
		.input(cardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
			});

			if (!cardData) {
				return 0;
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				return 0;
			}
			const access = await getBoardAccess(columnData.boardId, userId);

			if (access === "none") {
				return 0;
			}

			const result = await db
				.select({ count: cardComment.id })
				.from(cardComment)
				.where(eq(cardComment.cardId, input.cardId));

			return result.length;
		}),

	createComment: protectedProcedure
		.route({
			method: "POST",
			path: "/api/card/{cardId}/comment",
			summary: "",
			tags: ["Card"],
		})
		.input(
			cardIdSchema.extend({
				content: z.string().min(1),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
			});

			if (!cardData) {
				throw new Error("Card not found");
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				throw new Error("Column not found");
			}
			const access = await getBoardAccess(columnData.boardId, userId);

			if (access === "none") {
				throw new Error("Board not found");
			}

			const newComment = await db
				.insert(cardComment)
				.values({
					id: nanoid(),
					cardId: input.cardId,
					userId,
					content: input.content,
				})
				.returning();

			const userData = await db.query.user.findFirst({
				where: eq(userTable.id, userId),
				columns: { id: true, name: true, image: true, username: true },
			});

			const mentionRegex = /@([a-z0-9_-]{6,30})/g;
			const mentions = input.content.match(mentionRegex);

			if (mentions && mentions.length > 0) {
				const mentionedUsernames = mentions.map((m) =>
					m.substring(1).toLowerCase()
				);

				const mentionedUsers = await db
					.select()
					.from(userTable)
					.where(sql`${userTable.username} IN (${mentionedUsernames})`);

				if (mentionedUsers.length > 0 && newComment[0]) {
					const commentId = newComment[0].id;

					await db.insert(notification).values(
						mentionedUsers
							.filter((u) => u.id !== userId)
							.map((u) => ({
								id: nanoid(),
								userId: u.id,
								type: "mention" as const,
								sourceId: commentId,
								sourceType: "comment",
								read: false,
							}))
					);
				}
			}

			return { ...newComment[0], user: userData };
		}),

	deleteComment: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/card/{cardId}/comment",
			summary: "",
			tags: ["Card"],
		})
		.input(cardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const comment = await db.query.cardComment.findFirst({
				where: eq(cardComment.id, input.cardId),
			});

			if (!comment) {
				throw new Error("Comment not found");
			}

			const cardData = await db.query.card.findFirst({
				where: eq(card.id, comment.cardId),
			});

			if (!cardData) {
				throw new Error("Card not found");
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				throw new Error("Column not found");
			}

			const access = await getBoardAccess(columnData.boardId, userId);
			const isAuthor = comment.userId === userId;
			const isAdmin = access === "owner" || access === "admin";

			if (!(isAuthor || isAdmin)) {
				throw new Error("You don't have permission to delete this comment");
			}

			await db.delete(cardComment).where(eq(cardComment.id, input.cardId));

			return { success: true };
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/api/card",
			summary: "",
			tags: ["Card"],
		})
		.input(
			columnIdSchema.extend({
				title: z.string().min(1),
				type: z.enum(["epic", "feature", "user_story", "bug", "task"]),
				description: z.string().optional(),
				acceptanceCriteria: z.string().optional(),
				assigneeId: z.string().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const columnData = await db.query.column.findFirst({
				where: eq(column.id, input.columnId),
			});

			if (!columnData) {
				throw new Error("Column not found");
			}

			await requireEditAccess(columnData.boardId, userId);

			const maxPosition = await db.query.card.findFirst({
				where: eq(card.columnId, input.columnId),
				orderBy: asc(card.position),
				columns: { position: true },
			});

			const maxCardNumber = await db.query.card.findFirst({
				where: eq(card.boardId, columnData.boardId),
				orderBy: asc(card.cardNumber),
				columns: { cardNumber: true },
			});

			const cardId = nanoid();
			const newCard = await db
				.insert(card)
				.values({
					id: cardId,
					boardId: columnData.boardId,
					columnId: input.columnId,
					title: input.title,
					type: input.type,
					description: input.description,
					acceptanceCriteria: input.acceptanceCriteria,
					assigneeId: input.assigneeId,
					position: (maxPosition?.position ?? -1) + 1,
					cardNumber: (maxCardNumber?.cardNumber ?? 0) + 1,
				})
				.returning();

			await logCardChange(
				cardId,
				userId,
				"CREATE",
				null,
				null,
				JSON.stringify({
					title: input.title,
					type: input.type,
					description: input.description,
					acceptanceCriteria: input.acceptanceCriteria,
				})
			);

			return newCard[0];
		}),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/card/{cardId}",
			summary: "",
			tags: ["Card"],
		})
		.input(
			cardIdSchema.extend({
				title: z.string().min(1).optional(),
				type: z.enum(["epic", "feature", "user_story", "bug", "task"]),
				description: z.string().optional(),
				acceptanceCriteria: z.string().optional(),
				columnId: z.string().optional(),
				position: z.number().optional(),
				assigneeId: z.string().nullable().optional(),
				agentTriggerUrl: z.string().nullable().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
			});

			if (!cardData) {
				throw new Error("Card not found");
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				throw new Error("Column not found");
			}

			await requireEditAccess(columnData.boardId, userId);

			const { cardId, ...updateData } = input;
			const updatedCard = await db
				.update(card)
				.set({ ...updateData, updatedAt: new Date() })
				.where(eq(card.id, input.cardId))
				.returning();

			for (const [field, newValue] of Object.entries(updateData)) {
				const oldValue = cardData[field as keyof typeof cardData];
				const oldStr =
					oldValue !== undefined && oldValue !== null ? String(oldValue) : null;
				const newStr =
					newValue !== undefined && newValue !== null ? String(newValue) : null;

				if (oldStr !== newStr) {
					await logCardChange(
						cardId,
						userId,
						"UPDATE",
						field,
						oldStr ?? undefined,
						newStr ?? undefined
					);
				}
			}

			return updatedCard;
		}),

	delete: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/card/{cardId}",
			summary: "",
			tags: ["Card"],
		})
		.input(cardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
			});

			if (!cardData) {
				throw new Error("Card not found");
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				throw new Error("Column not found");
			}

			await requireEditAccess(columnData.boardId, userId);

			await logCardChange(
				input.cardId,
				userId,
				"DELETE",
				null,
				JSON.stringify(cardData),
				null
			);

			await db.delete(card).where(eq(card.id, input.cardId));
			return { success: true };
		}),

	move: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/card/{cardId}/move",
			summary: "",
			tags: ["Card"],
		})
		.input(cardIdSchema.extend({ columnId: z.string(), position: z.number() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
			});

			if (!cardData) {
				throw new Error("Card not found");
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				throw new Error("Column not found");
			}

			await requireEditAccess(columnData.boardId, userId);

			if (cardData.columnId !== input.columnId) {
				await logCardChange(
					input.cardId,
					userId,
					"MOVE",
					"columnId",
					cardData.columnId,
					input.columnId
				);
			}

			if (cardData.position !== input.position) {
				await logCardChange(
					input.cardId,
					userId,
					"MOVE",
					"position",
					String(cardData.position),
					String(input.position)
				);
			}

			return await db
				.update(card)
				.set({
					columnId: input.columnId,
					position: input.position,
					updatedAt: new Date(),
				})
				.where(eq(card.id, input.cardId))
				.returning();
		}),

	triggerAgent: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}/agent",
			summary: "",
			tags: ["Card"],
		})
		.input(cardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
			});

			if (!cardData) {
				throw new Error("Card not found");
			}

			if (!cardData.agentTriggerUrl) {
				throw new Error("No agent trigger URL configured for this card");
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				throw new Error("Column not found");
			}

			await requireEditAccess(columnData.boardId, userId);

			try {
				const response = await fetch(cardData.agentTriggerUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						cardId: cardData.id,
						title: cardData.title,
						description: cardData.description,
						acceptanceCriteria: cardData.acceptanceCriteria,
						triggeredBy: userId,
					}),
				});

				if (!response.ok) {
					throw new Error(`Agent trigger failed: ${response.statusText}`);
				}

				return { success: true, message: "Agent triggered successfully" };
			} catch (error) {
				throw new Error(`Failed to trigger agent: ${error}`);
			}
		}),

	getLinks: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}/link",
			summary: "",
			tags: ["Card"],
		})
		.input(cardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
			});

			if (!cardData) {
				throw new Error("Card not found");
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				throw new Error("Column not found");
			}

			const access = await getBoardAccess(columnData.boardId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			const outgoingLinks = await db.query.cardLink.findMany({
				where: eq(cardLink.sourceCardId, input.cardId),
			});

			const incomingLinks = await db.query.cardLink.findMany({
				where: eq(cardLink.targetCardId, input.cardId),
			});

			const targetCardIds = outgoingLinks.map((l) => l.targetCardId);
			const sourceCardIds = incomingLinks.map((l) => l.sourceCardId);
			const allRelatedCardIds = [
				...new Set([...targetCardIds, ...sourceCardIds]),
			];

			let relatedCards: (typeof card.$inferSelect)[] = [];
			if (allRelatedCardIds.length > 0) {
				relatedCards = await db
					.select()
					.from(card)
					.where(inArray(card.id, allRelatedCardIds));
			}

			const cardMap = new Map(relatedCards.map((c) => [c.id, c]));

			const outgoingWithDetails = outgoingLinks.map((link) => {
				const targetCard = cardMap.get(link.targetCardId);
				return {
					...link,
					targetCard: targetCard
						? {
								id: targetCard.id,
								cardNumber: targetCard.cardNumber,
								title: targetCard.title,
								type: targetCard.type,
							}
						: null,
				};
			});

			const incomingWithDetails = incomingLinks.map((link) => {
				const sourceCard = cardMap.get(link.sourceCardId);
				return {
					...link,
					sourceCard: sourceCard
						? {
								id: sourceCard.id,
								cardNumber: sourceCard.cardNumber,
								title: sourceCard.title,
								type: sourceCard.type,
							}
						: null,
				};
			});

			return {
				outgoing: outgoingWithDetails,
				incoming: incomingWithDetails,
			};
		}),

	getLinkCount: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}/link/count",
			summary: "",
			tags: ["Card"],
		})
		.input(cardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const cardData = await db.query.card.findFirst({
				where: eq(card.id, input.cardId),
			});

			if (!cardData) {
				return 0;
			}

			const columnData = await db.query.column.findFirst({
				where: eq(column.id, cardData.columnId),
			});
			if (!columnData) {
				return 0;
			}

			const access = await getBoardAccess(columnData.boardId, userId);
			if (access === "none") {
				return 0;
			}

			const outgoingCount = await db
				.select({ count: cardLink.id })
				.from(cardLink)
				.where(eq(cardLink.sourceCardId, input.cardId));

			const incomingCount = await db
				.select({ count: cardLink.id })
				.from(cardLink)
				.where(eq(cardLink.targetCardId, input.cardId));

			return outgoingCount.length + incomingCount.length;
		}),

	searchCards: protectedProcedure
		.route({
			method: "GET",
			path: "/api/board/{boardId}/card/{cardId}/comment/count",
			summary: "",
			tags: ["Card"],
		})
		.input(
			z.object({
				boardId: z.string(),
				query: z.string(),
				excludeCardId: z.string().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getBoardAccess(input.boardId, userId);

			if (access === "none") {
				throw new Error("Board not found");
			}

			const queryNum = Number.parseInt(input.query, 10);

			let cards: (typeof card.$inferSelect)[] = [];
			if (!Number.isNaN(queryNum)) {
				cards = await db
					.select()
					.from(card)
					.where(
						sql`${card.boardId} = ${input.boardId} AND ${card.cardNumber} = ${queryNum}${
							input.excludeCardId
								? sql` AND ${card.id} != ${input.excludeCardId}`
								: sql``
						}`
					);
			} else if (input.query.trim().length > 0) {
				cards = await db
					.select()
					.from(card)
					.where(
						sql`${card.boardId} = ${input.boardId} AND LOWER(${card.title}) LIKE ${`%${input.query.toLowerCase()}%`}${
							input.excludeCardId
								? sql` AND ${card.id} != ${input.excludeCardId}`
								: sql``
						}`
					);
			}

			return cards.map((c) => ({
				id: c.id,
				cardNumber: c.cardNumber,
				title: c.title,
				type: c.type,
			}));
		}),

	createLink: protectedProcedure
		.route({
			method: "POST",
			path: "/api/card/{sourceCardId}/link/{targetCardId}",
			summary: "",
			tags: ["Card"],
		})
		.input(
			z.object({
				sourceCardId: z.string(),
				targetCardId: z.string(),
				linkType: z.enum(cardLinkType),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const sourceCard = await db.query.card.findFirst({
				where: eq(card.id, input.sourceCardId),
			});
			if (!sourceCard) {
				throw new Error("Source card not found");
			}

			const targetCard = await db.query.card.findFirst({
				where: eq(card.id, input.targetCardId),
			});
			if (!targetCard) {
				throw new Error("Target card not found");
			}

			if (sourceCard.boardId !== targetCard.boardId) {
				throw new Error("Cannot link cards from different boards");
			}

			const access = await getBoardAccess(sourceCard.boardId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			const existingLink = await db
				.select()
				.from(cardLink)
				.where(
					sql`${cardLink.sourceCardId} = ${input.sourceCardId} AND ${cardLink.targetCardId} = ${input.targetCardId}`
				);

			if (existingLink.length > 0) {
				throw new Error("Link already exists");
			}

			const reverseLink = await db
				.select()
				.from(cardLink)
				.where(
					sql`${cardLink.sourceCardId} = ${input.targetCardId} AND ${cardLink.targetCardId} = ${input.sourceCardId}`
				);

			const reverseLinkType = getReverseLinkType(
				input.linkType
			) as (typeof cardLinkType)[number];

			await db.insert(cardLink).values({
				id: nanoid(),
				sourceCardId: input.sourceCardId,
				targetCardId: input.targetCardId,
				linkType: input.linkType,
			});

			if (reverseLink.length === 0) {
				await db.insert(cardLink).values({
					id: nanoid(),
					sourceCardId: input.targetCardId,
					targetCardId: input.sourceCardId,
					linkType: reverseLinkType,
				});
			}

			return { success: true };
		}),

	deleteLink: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}/link",
			summary: "",
			tags: ["Card"],
		})
		.input(
			z.object({
				cardId: z.string(),
				linkId: z.string(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const link = await db.query.cardLink.findFirst({
				where: eq(cardLink.id, input.linkId),
			});

			if (
				!link ||
				(link.sourceCardId !== input.cardId &&
					link.targetCardId !== input.cardId)
			) {
				throw new Error("Link not found");
			}

			const sourceCard = await db.query.card.findFirst({
				where: eq(card.id, link.sourceCardId),
			});

			if (!sourceCard) {
				throw new Error("Source card not found");
			}

			const access = await getBoardAccess(sourceCard.boardId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			await db
				.delete(cardLink)
				.where(
					sql`(${cardLink.sourceCardId} = ${link.sourceCardId} AND ${cardLink.targetCardId} = ${link.targetCardId}) OR (${cardLink.sourceCardId} = ${link.targetCardId} AND ${cardLink.targetCardId} = ${link.sourceCardId})`
				);

			return { success: true };
		}),
};
