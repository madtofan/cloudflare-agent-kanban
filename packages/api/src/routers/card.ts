import { cardLinkType } from "@cloudflare-agent-kanban/types";
import z from "zod";
import { callDo } from "../do-client";
import { protectedProcedure } from "../index";
import { getProjectAccess, withErrorResponses } from "../utils";
import { requireEditAccess } from "./project";

export const cardRouter = {
	getByColumnId: protectedProcedure
		.route({
			method: "GET",
			path: "/api/column/{columnId}/card",
			summary: "List cards in a column",
			description: "Returns all cards belonging to a specific column within a board.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "List of cards in the column.",
			spec: withErrorResponses({ "401": "Authentication required.", "404": "Board not found." }),
		})
		.input(z.object({ columnId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "getCardsByColumnId", {
				columnId: input.columnId,
			});
		}),

	getByBoardId: protectedProcedure
		.route({
			method: "GET",
			path: "/api/board/{boardId}/card",
			summary: "List cards on a board",
			description: "Returns all cards grouped by column for a specific board.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "Cards grouped by column for the board.",
			spec: withErrorResponses({ "401": "Authentication required.", "404": "Board not found." }),
		})
		.input(z.object({ boardId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "getCardsByBoardId", {
				boardId: input.boardId,
			});
		}),

	getById: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}",
			summary: "Get a card by ID",
			description: "Returns a single card with its labels for the given card ID.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "The card with its labels.",
			spec: withErrorResponses({ "401": "Authentication required.", "404": "Card not found." }),
		})
		.input(z.object({ cardId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "getCard", {
				cardId: input.cardId,
			});
		}),

	getHistory: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}/history",
			summary: "Get card change history",
			description: "Returns the audit log of all changes made to a card, including field updates and column moves.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "Audit log of changes made to the card.",
			spec: withErrorResponses({ "401": "Authentication required.", "404": "Card not found." }),
		})
		.input(z.object({ cardId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "getHistory", {
				cardId: input.cardId,
			});
		}),

	getComments: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}/comment",
			summary: "List comments on a card",
			description: "Returns all comments for a specific card, including user details.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "List of comments on the card with user details.",
			spec: withErrorResponses({ "401": "Authentication required.", "404": "Card not found." }),
		})
		.input(z.object({ cardId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "getComments", {
				cardId: input.cardId,
			});
		}),

	createComment: protectedProcedure
		.route({
			method: "POST",
			path: "/api/card/{cardId}/comment",
			summary: "Create a comment on a card",
			description: "Adds a new comment to a card. Requires edit access to the project.",
			tags: ["Card"],
			successStatus: 201,
			successDescription: "Comment created successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Insufficient permissions to comment.", "404": "Card not found." }),
		})
		.input(
			z.object({
				cardId: z.string(),
				content: z.string().min(1),
				projectId: z.string(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "createComment", {
				cardId: input.cardId,
				userId,
				content: input.content,
			});
		}),

	deleteComment: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/card/{cardId}/comment/{commentId}",
			summary: "Delete a comment from a card",
			description: "Permanently removes a comment from a card.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "Comment deleted successfully.",
			spec: withErrorResponses({ "401": "Authentication required." }),
		})
		.input(
			z.object({
				cardId: z.string(),
				commentId: z.string(),
				projectId: z.string(),
			})
		)
		.handler(({ context, input }) => {
			return callDo(context.env, input.projectId, "deleteComment", {
				commentId: input.commentId,
			});
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/api/card",
			summary: "Create a new card",
			description: "Creates a new card in the specified column. Requires edit access to the project.",
			tags: ["Card"],
			successStatus: 201,
			successDescription: "Card created successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Insufficient permissions to create cards." }),
		})
		.input(
			z.object({
				columnId: z.string(),
				projectId: z.string(),
				title: z.string().min(5),
				type: z.enum(["epic", "feature", "user_story", "bug", "task"]),
				description: z.string().optional(),
				acceptanceCriteria: z.string().optional(),
				assigneeId: z.string().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.projectId, userId);

			return callDo(context.env, input.projectId, "createCard", {
				cardId: crypto.randomUUID(),
				columnId: input.columnId,
				userId,
				title: input.title,
				type: input.type,
				description: input.description,
				acceptanceCriteria: input.acceptanceCriteria,
				assigneeId: input.assigneeId,
			});
		}),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/card/{cardId}",
			summary: "Update a card",
			description: "Updates one or more fields of a card. If columnId is provided, the card is moved to that column at the specified position.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "Card updated successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Insufficient permissions to update cards." }),
		})
		.input(
			z.object({
				cardId: z.string(),
				projectId: z.string(),
				title: z.string().min(1).optional(),
				type: z
					.enum(["epic", "feature", "user_story", "bug", "task"])
					.optional(),
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
			await requireEditAccess(input.projectId, userId);

			if (input.columnId !== undefined) {
				return callDo(context.env, input.projectId, "moveCard", {
					cardId: input.cardId,
					userId,
					newColumnId: input.columnId,
					newPosition: input.position ?? 0,
				});
			}

			return callDo(context.env, input.projectId, "updateCard", {
				cardId: input.cardId,
				userId,
				title: input.title,
				type: input.type,
				description: input.description,
				acceptanceCriteria: input.acceptanceCriteria,
				position: input.position,
				assigneeId: input.assigneeId,
				agentTriggerUrl: input.agentTriggerUrl,
			});
		}),

	delete: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/card/{cardId}",
			summary: "Delete a card",
			description: "Permanently deletes a card and all its associated comments and links.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "Card deleted successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Insufficient permissions to delete cards." }),
		})
		.input(z.object({ cardId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.projectId, userId);

			return callDo(context.env, input.projectId, "deleteCard", {
				cardId: input.cardId,
				userId,
			});
		}),

	triggerAgent: protectedProcedure
		.route({
			method: "POST",
			path: "/api/card/{cardId}/agent",
			summary: "Trigger an external agent for a card",
			description: "Fires the configured agent trigger URL for a card, sending card details to an external automation system.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "Agent triggered successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Insufficient permissions.", "404": "No agent trigger URL configured for this card.", "500": "Failed to trigger agent." }),
		})
		.input(z.object({ cardId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.projectId, userId);

			const cardResult = await callDo(context.env, input.projectId, "getCard", {
				cardId: input.cardId,
			});

			if (!cardResult.agentTriggerUrl) {
				throw new Error("No agent trigger URL configured for this card");
			}

			try {
				const response = await fetch(cardResult.agentTriggerUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						cardId: cardResult.id,
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
			summary: "Get card links",
			description: "Returns all outgoing and incoming links for a card, including linked card details.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "List of outgoing and incoming links for the card.",
			spec: withErrorResponses({ "401": "Authentication required.", "404": "Card not found." }),
		})
		.input(z.object({ cardId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "getLinks", {
				cardId: input.cardId,
			});
		}),

	searchCards: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/search",
			summary: "Search cards",
			description: "Searches cards within a board by title or other criteria. Returns matching cards with basic information.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "Matching cards with basic information.",
			spec: withErrorResponses({ "401": "Authentication required." }),
		})
		.input(
			z.object({
				boardId: z.string(),
				projectId: z.string(),
				query: z.string(),
				excludeCardId: z.string().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "searchCards", {
				boardId: input.boardId,
				query: input.query,
				excludeCardId: input.excludeCardId,
				userId,
			});
		}),

	createLink: protectedProcedure
		.route({
			method: "POST",
			path: "/api/card/{sourceCardId}/link/{targetCardId}",
			summary: "Link two cards together",
			description: "Creates a relationship link between two cards with a specified link type (e.g., blocks, relates to).",
			tags: ["Card"],
			successStatus: 201,
			successDescription: "Link created between the two cards.",
			spec: withErrorResponses({ "401": "Authentication required." }),
		})
		.input(
			z.object({
				sourceCardId: z.string(),
				targetCardId: z.string(),
				linkType: z.enum(cardLinkType),
				projectId: z.string(),
			})
		)
		.handler(({ context, input }) => {
			const userId = context.session.user.id;

			return callDo(context.env, input.projectId, "createLink", {
				sourceCardId: input.sourceCardId,
				targetCardId: input.targetCardId,
				userId,
				linkType: input.linkType,
			});
		}),

	deleteLink: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/card/{cardId}/link/{linkId}",
			summary: "Remove a link between cards",
			description: "Deletes a specific link relationship between two cards.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "Link removed successfully.",
			spec: withErrorResponses({ "401": "Authentication required." }),
		})
		.input(
			z.object({
				cardId: z.string(),
				linkId: z.string(),
				projectId: z.string(),
			})
		)
		.handler(({ context, input }) => {
			const userId = context.session.user.id;

			return callDo(context.env, input.projectId, "deleteLink", {
				cardId: input.cardId,
				linkId: input.linkId,
				userId,
			});
		}),

	archive: protectedProcedure
		.route({
			method: "POST",
			path: "/api/card/{cardId}/archive",
			summary: "Archive a card",
			description: "Archives a card, moving it out of the active board view while preserving its data.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "Card archived successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Insufficient permissions to archive cards." }),
		})
		.input(z.object({ cardId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.projectId, userId);

			return callDo(context.env, input.projectId, "archiveCards", {
				cardId: input.cardId,
				userId,
			});
		}),

	archiveByColumnId: protectedProcedure
		.route({
			method: "POST",
			path: "/api/column/{columnId}/archive",
			summary: "Archive all cards in a column",
			description: "Archives every card within a specified column at once.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "All cards in the column archived successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Insufficient permissions to archive cards." }),
		})
		.input(z.object({ columnId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.projectId, userId);

			return callDo(context.env, input.projectId, "archiveByColumn", {
				columnId: input.columnId,
				userId,
			});
		}),

	getArchivedByBoardId: protectedProcedure
		.route({
			method: "GET",
			path: "/api/board/{boardId}/archive",
			summary: "List archived cards on a board",
			description: "Returns all archived cards for a board, including their original column names.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "List of archived cards with original column information.",
			spec: withErrorResponses({ "401": "Authentication required.", "404": "Board not found." }),
		})
		.input(z.object({ boardId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "getArchivedCards", {
				boardId: input.boardId,
			});
		}),

	unarchive: protectedProcedure
		.route({
			method: "POST",
			path: "/api/card/bulk/unarchive",
			summary: "Bulk unarchive cards",
			description: "Restores multiple archived cards back to their original columns on the board.",
			tags: ["Card"],
			successStatus: 200,
			successDescription: "Cards unarchived successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Insufficient permissions to unarchive cards." }),
		})
		.input(z.object({ cardIds: z.array(z.string()), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			if (input.cardIds.length === 0) {
				return { success: true, unarchivedCount: 0 };
			}

			const firstCardId = input.cardIds[0];
			if (!firstCardId) {
				return { success: true, unarchivedCount: 0 };
			}
			await requireEditAccess(input.projectId, userId);

			return callDo(context.env, input.projectId, "unarchiveCards", {
				cardIds: input.cardIds,
				userId,
			});
		}),
};
