import { cardLinkType } from "@cloudflare-agent-kanban/types";
import z from "zod";
import { callDo } from "../do-client";
import { protectedProcedure } from "../index";
import { getProjectAccess } from "../utils";
import { requireEditAccess } from "./project";

export const cardRouter = {
	getByColumnId: protectedProcedure
		.route({
			method: "GET",
			path: "/api/column/{columnId}/card",
			summary: "",
			tags: ["Card"],
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
			summary: "",
			tags: ["Card"],
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
			summary: "",
			tags: ["Card"],
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
			path: "/api/card/history/{cardId}",
			summary: "",
			tags: ["Card"],
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
			summary: "",
			tags: ["Card"],
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
			summary: "",
			tags: ["Card"],
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
			path: "/api/card/{cardId}/comment",
			summary: "",
			tags: ["Card"],
		})
		.input(z.object({ cardId: z.string(), projectId: z.string() }))
		.handler(({ context, input }) => {
			return callDo(context.env, input.projectId, "deleteComment", {
				commentId: input.cardId,
			});
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/api/card",
			summary: "",
			tags: ["Card"],
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
			summary: "",
			tags: ["Card"],
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
			summary: "",
			tags: ["Card"],
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

	move: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/card/{cardId}/move",
			summary: "",
			tags: ["Card"],
		})
		.input(
			z.object({
				cardId: z.string(),
				projectId: z.string(),
				columnId: z.string(),
				position: z.number(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.projectId, userId);

			return callDo(context.env, input.projectId, "moveCard", {
				cardId: input.cardId,
				userId,
				newColumnId: input.columnId,
				newPosition: input.position,
			});
		}),

	triggerAgent: protectedProcedure
		.route({
			method: "GET",
			path: "/api/card/{cardId}/agent",
			summary: "",
			tags: ["Card"],
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
			summary: "",
			tags: ["Card"],
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
			summary: "",
			tags: ["Card"],
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
			summary: "",
			tags: ["Card"],
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
			summary: "",
			tags: ["Card"],
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
			method: "PUT",
			path: "/api/card/{cardId}/archive",
			summary: "",
			tags: ["Card"],
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
			method: "PUT",
			path: "/api/column/{columnId}/archive-cards",
			summary: "",
			tags: ["Card"],
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
			path: "/api/board/{boardId}/card/archived",
			summary: "",
			tags: ["Card"],
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
			method: "PUT",
			path: "/api/card/unarchive",
			summary: "",
			tags: ["Card"],
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
