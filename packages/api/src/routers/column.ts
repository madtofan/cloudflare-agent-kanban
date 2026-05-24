import z from "zod";
import { callDo } from "../do-client";
import { protectedProcedure } from "../index";
import { getProjectAccess } from "../utils";
import { requireEditAccess } from "./project";

export const columnRouter = {
	getByBoardId: protectedProcedure
		.route({
			method: "GET",
			path: "/api/project/{projectId}/board/{boardId}/column",
			summary: "",
			tags: ["Column"],
		})
		.input(z.object({ boardId: z.string(), projectId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "getColumns", {
				boardId: input.boardId,
			});
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/api/project/{projectId}/board/{boardId}/column",
			summary: "",
			tags: ["Column"],
		})
		.input(
			z.object({
				boardId: z.string(),
				projectId: z.string(),
				name: z.string().min(1),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.projectId, userId);

			const columnId = crypto.randomUUID();
			return callDo(context.env, input.projectId, "createColumn", {
				boardId: input.boardId,
				columnId,
				userId,
				name: input.name,
			});
		}),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/project/{projectId}/board/{boardId}/column/{columnId}",
			summary: "",
			tags: ["Column"],
		})
		.input(
			z.object({
				projectId: z.string(),
				boardId: z.string(),
				columnId: z.string(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				position: z.number().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.projectId, userId);

			return callDo(context.env, input.projectId, "updateColumn", {
				boardId: input.boardId,
				columnId: input.columnId,
				userId,
				name: input.name,
				description: input.description,
				position: input.position,
			});
		}),

	delete: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/project/{projectId}/board/{boardId}/column/{columnId}",
			summary: "",
			tags: ["Column"],
		})
		.input(
			z.object({
				projectId: z.string(),
				boardId: z.string(),
				columnId: z.string(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.projectId, userId);

			return callDo(context.env, input.projectId, "deleteColumn", {
				boardId: input.boardId,
				columnId: input.columnId,
				userId,
			});
		}),

	reorder: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/project/{projectId}/board/{boardId}/column/sort",
			summary: "",
			tags: ["Column"],
		})
		.input(
			z.object({
				projectId: z.string(),
				boardId: z.string(),
				columns: z.array(z.object({ id: z.string(), position: z.number() })),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.projectId, userId);

			return callDo(context.env, input.projectId, "reorderColumns", {
				boardId: input.boardId,
				userId,
				columns: input.columns,
			});
		}),
};
