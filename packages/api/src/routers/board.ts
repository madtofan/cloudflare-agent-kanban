import z from "zod";
import { callDo } from "../do-client";
import { protectedProcedure } from "../index";
import { getProjectAccess, withErrorResponses } from "../utils";

const projectIdSchema = z.object({ projectId: z.string() });

export const boardRouter = {
	getById: protectedProcedure
		.route({
			method: "GET",
			path: "/api/project/{projectId}/board/{boardId}",
			summary: "Get a board by ID",
			description: "Returns a single board within a project.",
			tags: ["Board"],
			successStatus: 200,
			successDescription: "The board details.",
			spec: withErrorResponses({ "401": "Authentication required.", "404": "Board not found." }),
		})
		.input(projectIdSchema.extend({ boardId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Board not found");
			}

			return callDo(context.env, input.projectId, "getBoard", {
				boardId: input.boardId,
			});
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/api/project/{projectId}/board",
			summary: "Create a board in a project",
			description: "Creates a new board within a project. Requires member-level access or higher.",
			tags: ["Board"],
			successStatus: 201,
			successDescription: "The board was created successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Insufficient permissions to create a board.", "404": "Project not found." }),
		})
		.input(
			projectIdSchema.extend({
				name: z.string().min(1),
				description: z.string().optional(),
				visibility: z.enum(["private", "public"]).default("private"),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const projectAccess = await getProjectAccess(input.projectId, userId);
			if (projectAccess === "none") {
				throw new Error("Project not found");
			}
			if (projectAccess === "viewer") {
				throw new Error("You don't have access to this project");
			}

			return callDo(context.env, input.projectId, "createBoard", {
				boardId: crypto.randomUUID(),
				name: input.name,
				description: input.description,
				visibility: input.visibility,
				ownerId: userId,
			});
		}),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/project/{projectId}/board/{boardId}",
			summary: "Update a board",
			description: "Updates the name, description, or visibility of a board. Requires owner or admin access.",
			tags: ["Board"],
			successStatus: 200,
			successDescription: "The board was updated successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Only owner and admins can update the board." }),
		})
		.input(
			projectIdSchema.extend({
				boardId: z.string(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				visibility: z.enum(["private", "public"]).optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access !== "owner" && access !== "admin") {
				throw new Error("Only owner and admins can update the board");
			}

			return callDo(context.env, input.projectId, "updateBoard", {
				boardId: input.boardId,
				userId,
				name: input.name,
				description: input.description,
				visibility: input.visibility,
			});
		}),

	delete: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/project/{projectId}/board/{boardId}",
			summary: "Delete a board",
			description: "Permanently deletes a board and all its columns and cards. Only the project owner can delete boards.",
			tags: ["Board"],
			successStatus: 200,
			successDescription: "The board was deleted successfully.",
			spec: withErrorResponses({ "401": "Authentication required.", "403": "Only the project owner can delete the board." }),
		})
		.input(projectIdSchema.extend({ boardId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access !== "owner") {
				throw new Error("Only the owner can delete the board");
			}

			return callDo(context.env, input.projectId, "deleteBoard", {
				boardId: input.boardId,
				userId,
			});
		}),
};
