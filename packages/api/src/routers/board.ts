import { db } from "@cloudflare-agent-kanban/db";
import {
	board,
	projectMember,
} from "@cloudflare-agent-kanban/db/schema/kanban";
import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";
import { protectedProcedure } from "../index";
import { getBoardAccess } from "../utils";

const boardIdSchema = z.object({ boardId: z.string() });

export async function requireEditAccess(boardId: string, userId: string) {
	const access = await getBoardAccess(boardId, userId);
	if (access === "none" || access === "viewer") {
		throw new Error("Access denied");
	}
	return access;
}

export const boardRouter = {
	getAll: protectedProcedure
		.route({
			method: "GET",
			path: "/api/board",
			summary: "",
			tags: ["Board"],
		})
		.handler(async ({ context }) => {
			const userId = context.session.user.id;

			const ownedBoards = await db.query.board.findMany({
				where: eq(board.ownerId, userId),
			});

			const projectMemberships = await db.query.projectMember.findMany({
				where: eq(projectMember.userId, userId),
			});

			const memberProjectIds = projectMemberships.map((pm) => pm.projectId);

			let memberBoards: (typeof board.$inferSelect)[] = [];
			if (memberProjectIds.length > 0) {
				memberBoards = await db.query.board.findMany({
					where: inArray(board.projectId, memberProjectIds),
				});
			}

			const publicBoards = await db.query.board.findMany({
				where: eq(board.visibility, "public"),
			});

			const allBoards = [...ownedBoards, ...memberBoards, ...publicBoards];
			const uniqueBoards = allBoards.filter(
				(board, index, self) =>
					index === self.findIndex((b) => b.id === board.id)
			);

			return uniqueBoards;
		}),

	getById: protectedProcedure
		.route({
			method: "GET",
			path: "/api/board/{boardId}",
			summary: "",
			tags: ["Board"],
		})
		.input(boardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getBoardAccess(input.boardId, userId);

			if (access === "none") {
				throw new Error("Board not found");
			}

			const boardData = await db.query.board.findFirst({
				where: eq(board.id, input.boardId),
			});

			if (!boardData) {
				throw new Error("Board not found");
			}

			return boardData;
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/api/board",
			summary: "",
			tags: ["Board"],
		})
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().optional(),
				visibility: z.enum(["private", "public"]).default("private"),
				projectId: z.string(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const boardId = nanoid();

			const projectId = input.projectId;

			const { getProjectAccess } = await import("../utils");
			const projectAccess = await getProjectAccess(projectId, userId);
			if (projectAccess === "none") {
				throw new Error("Project not found");
			}
			if (projectAccess === "viewer") {
				throw new Error("You don't have access to this project");
			}

			const newBoard = await db
				.insert(board)
				.values({
					id: boardId,
					name: input.name,
					description: input.description,
					visibility: input.visibility,
					ownerId: userId,
					projectId,
				})
				.returning();

			return newBoard[0];
		}),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/board/{boardId}",
			summary: "",
			tags: ["Board"],
		})
		.input(
			boardIdSchema.extend({
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				visibility: z.enum(["private", "public"]).optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await requireEditAccess(input.boardId, userId);

			if (access !== "owner" && access !== "admin") {
				throw new Error("Only owner and admins can update the board");
			}

			const boardData = await db.query.board.findFirst({
				where: eq(board.id, input.boardId),
			});

			if (!boardData) {
				throw new Error("Board not found");
			}

			const { boardId, ...updateData } = input;
			return await db
				.update(board)
				.set({ ...updateData, updatedAt: new Date() })
				.where(eq(board.id, input.boardId))
				.returning();
		}),

	delete: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/board/{boardId}",
			summary: "",
			tags: ["Board"],
		})
		.input(boardIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await requireEditAccess(input.boardId, userId);

			if (access !== "owner") {
				throw new Error("Only the owner can delete the board");
			}

			await db.delete(board).where(eq(board.id, input.boardId));
			return { success: true };
		}),
};
