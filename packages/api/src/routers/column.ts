import { db } from "@cloudflare-agent-kanban/db";
import { column } from "@cloudflare-agent-kanban/db/schema/kanban";
import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";
import { protectedProcedure } from "../index";
import { getBoardAccess } from "../utils";
import { requireEditAccess } from "./board";

const boardIdSchema = z.object({ boardId: z.string() });

export const columnRouter = {
	getByBoardId: protectedProcedure
		.route({
			method: "GET",
			path: "/api/board/{boardId}/column",
			summary: "",
			tags: ["Column"],
		})
		.input(boardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getBoardAccess(input.boardId, userId);

			if (access === "none") {
				throw new Error("Board not found");
			}

			const columns = await db.query.column.findMany({
				where: eq(column.boardId, input.boardId),
				orderBy: asc(column.position),
			});

			return columns;
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/api/board/{boardId}/column",
			summary: "",
			tags: ["Column"],
		})
		.input(boardIdSchema.extend({ name: z.string().min(1) }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.boardId, userId);

			const maxPosition = await db.query.column.findFirst({
				where: eq(column.boardId, input.boardId),
				orderBy: asc(column.position),
				columns: { position: true },
			});

			const newColumn = await db
				.insert(column)
				.values({
					id: nanoid(),
					boardId: input.boardId,
					name: input.name,
					position: (maxPosition?.position ?? -1) + 1,
				})
				.returning();

			return newColumn[0];
		}),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/board/{boardId}/column/{columnId}",
			summary: "",
			tags: ["Column"],
		})
		.input(
			boardIdSchema.extend({
				columnId: z.string(),
				name: z.string().min(1).optional(),
				position: z.number().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const columnData = await db.query.column.findFirst({
				where: eq(column.id, input.columnId),
			});

			if (!columnData || columnData.boardId !== input.boardId) {
				throw new Error("Column not found");
			}

			await requireEditAccess(columnData.boardId, userId);

			return await db
				.update(column)
				.set({
					name: input.name,
					position: input.position,
					updatedAt: new Date(),
				})
				.where(eq(column.id, input.columnId))
				.returning();
		}),

	delete: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/board/{boardId}/column/{columnId}",
			summary: "",
			tags: ["Column"],
		})
		.input(
			boardIdSchema.extend({
				columnId: z.string(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const columnData = await db.query.column.findFirst({
				where: eq(column.id, input.columnId),
			});

			if (!columnData || columnData.boardId !== input.boardId) {
				throw new Error("Column not found");
			}

			await requireEditAccess(columnData.boardId, userId);

			await db.delete(column).where(eq(column.id, input.columnId));
			return { success: true };
		}),

	reorder: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/board/{boardId}/column/sort",
			summary: "",
			tags: ["Column"],
		})
		.input(
			z.object({
				boardId: z.string(),
				columns: z.array(z.object({ id: z.string(), position: z.number() })),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireEditAccess(input.boardId, userId);

			for (const col of input.columns) {
				await db
					.update(column)
					.set({ position: col.position })
					.where(eq(column.id, col.id));
			}

			return { success: true };
		}),
};
