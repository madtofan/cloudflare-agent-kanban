import { nanoid } from "nanoid";
import z from "zod";
import { callDo } from "../do-client";
import { protectedProcedure } from "../index";
import { getProjectAccess, type ProjectAccess } from "../utils";

const projectIdSchema = z.object({ projectId: z.string() });

async function requireMemberAccess(
	projectId: string,
	userId: string
): Promise<ProjectAccess> {
	const access = await getProjectAccess(projectId, userId);
	if (access === "none" || access === "viewer") {
		throw new Error("Access denied. Members only.");
	}
	return access;
}

export const documentationRouter = {
	getFolders: protectedProcedure
		.route({
			method: "GET",
			path: "/api/project/{projectId}/folders",
			summary: "Get all documentation folders",
			tags: ["Documentation"],
		})
		.input(projectIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Project not found");
			}

			return callDo(context.env, input.projectId, "getFolders");
		}),

	createFolder: protectedProcedure
		.route({
			method: "POST",
			path: "/api/project/{projectId}/folder",
			summary: "Create a documentation folder",
			tags: ["Documentation"],
		})
		.input(
			projectIdSchema.extend({
				name: z.string().min(1),
				parentFolderId: z.string().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireMemberAccess(input.projectId, userId);

			const folderId = nanoid();

			return callDo(context.env, input.projectId, "createFolder", {
				folderId,
				userId,
				name: input.name,
				parentFolderId: input.parentFolderId ?? null,
			});
		}),

	updateFolder: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/project/{projectId}/folder/{folderId}",
			summary: "Update a documentation folder",
			tags: ["Documentation"],
		})
		.input(
			projectIdSchema.extend({
				projectId: z.string(),
				folderId: z.string(),
				name: z.string().min(1).optional(),
				parentFolderId: z.string().nullable().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireMemberAccess(input.projectId, userId);

			return callDo(context.env, input.projectId, "updateFolder", {
				folderId: input.folderId,
				userId,
				name: input.name,
				parentFolderId: input.parentFolderId,
			});
		}),

	deleteFolder: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/project/{projectId}/folder/{folderId}",
			summary: "Delete a documentation folder",
			tags: ["Documentation"],
		})
		.input(projectIdSchema.extend({ folderId: z.string() }))
		.handler(({ context, input }) => {
			return callDo(context.env, input.projectId, "deleteFolder", {
				folderId: input.folderId,
			});
		}),

	getPages: protectedProcedure
		.route({
			method: "GET",
			path: "/api/project/{projectId}/pages",
			summary: "Get all documentation pages",
			tags: ["Documentation"],
		})
		.input(projectIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Project not found");
			}

			return callDo(context.env, input.projectId, "getPages");
		}),

	getPage: protectedProcedure
		.route({
			method: "GET",
			path: "/api/project/{projectId}/pages/{pageId}",
			summary: "Get a single documentation page",
			tags: ["Documentation"],
		})
		.input(projectIdSchema.extend({ pageId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);
			if (access === "none") {
				throw new Error("Project not found");
			}

			return callDo(context.env, input.projectId, "getPage", {
				pageId: input.pageId,
			});
		}),

	createPage: protectedProcedure
		.route({
			method: "POST",
			path: "/api/project/{projectId}/pages",
			summary: "Create a documentation page",
			tags: ["Documentation"],
		})
		.input(
			projectIdSchema.extend({
				title: z.string().min(1),
				content: z.string().default(""),
				folderId: z.string().optional(),
				visibility: z.enum(["public", "private"]).default("private"),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			await requireMemberAccess(input.projectId, userId);

			const pageId = nanoid();
			return callDo(context.env, input.projectId, "createPage", {
				pageId,
				userId,
				title: input.title,
				content: input.content,
				folderId: input.folderId ?? null,
				visibility: input.visibility,
			});
		}),

	updatePage: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/project/{projectId}/pages/{pageId}",
			summary: "Update a documentation page",
			tags: ["Documentation"],
		})
		.input(
			projectIdSchema.extend({
				pageId: z.string(),
				title: z.string().min(1).optional(),
				content: z.string().optional(),
				folderId: z.string().nullable().optional(),
				visibility: z.enum(["public", "private"]).optional(),
			})
		)
		.handler(({ context, input }) => {
			const userId = context.session.user.id;

			return callDo(context.env, input.projectId, "updatePage", {
				pageId: input.pageId,
				userId,
				title: input.title,
				content: input.content,
				folderId: input.folderId,
				visibility: input.visibility,
			});
		}),

	deletePage: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/project/{projectId}/pages/{pageId}",
			summary: "Delete a documentation page",
			tags: ["Documentation"],
		})
		.input(projectIdSchema.extend({ pageId: z.string() }))
		.handler(({ context, input }) => {
			return callDo(context.env, input.projectId, "deletePage", {
				pageId: input.pageId,
			});
		}),
};
