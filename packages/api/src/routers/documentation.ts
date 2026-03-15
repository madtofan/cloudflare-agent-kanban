import { db } from "@cloudflare-agent-kanban/db";
import {
	documentationFolder,
	documentationPage,
} from "@cloudflare-agent-kanban/db/schema/documentation";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";
import { protectedProcedure } from "../index";
import { getProjectAccess, type ProjectAccess } from "../utils";

const projectIdSchema = z.object({ projectId: z.string() });

const MAX_FOLDER_DEPTH = 5;

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

// TODO - make this a state. this function will overload the database
async function getFolderDepth(folderId: string | null): Promise<number> {
	if (!folderId) {
		return 0;
	}

	const folder = await db.query.documentationFolder.findFirst({
		where: eq(documentationFolder.id, folderId),
	});

	if (!folder) {
		return 0;
	}

	const parentDepth = await getFolderDepth(folder.parentFolderId);
	return parentDepth + 1;
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

			const folders = await db.query.documentationFolder.findMany({
				where: eq(documentationFolder.projectId, input.projectId),
				orderBy: (folder, { asc }) => [asc(folder.position), asc(folder.name)],
			});

			return folders;
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

			if (input.parentFolderId) {
				const parentFolder = await db.query.documentationFolder.findFirst({
					where: eq(documentationFolder.id, input.parentFolderId),
				});

				if (!parentFolder || parentFolder.projectId !== input.projectId) {
					throw new Error("Parent folder not found");
				}

				const depth = await getFolderDepth(input.parentFolderId);
				if (depth >= MAX_FOLDER_DEPTH - 1) {
					throw new Error(
						`Maximum folder depth of ${MAX_FOLDER_DEPTH} reached`
					);
				}
			}

			const folderId = nanoid();
			const newFolder = await db
				.insert(documentationFolder)
				.values({
					id: folderId,
					projectId: input.projectId,
					name: input.name,
					parentFolderId: input.parentFolderId || null,
				})
				.returning();

			return newFolder[0];
		}),

	updateFolder: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/folder/{folderId}",
			summary: "Update a documentation folder",
			tags: ["Documentation"],
		})
		.input(
			z.object({
				folderId: z.string(),
				name: z.string().min(1).optional(),
				parentFolderId: z.string().nullable().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const existingFolder = await db.query.documentationFolder.findFirst({
				where: eq(documentationFolder.id, input.folderId),
			});

			if (!existingFolder) {
				throw new Error("Folder not found");
			}

			await requireMemberAccess(existingFolder.projectId, userId);

			if (input.parentFolderId !== undefined) {
				if (input.parentFolderId === input.folderId) {
					throw new Error("Folder cannot be its own parent");
				}

				if (input.parentFolderId) {
					const depth = await getFolderDepth(input.parentFolderId);
					if (depth >= MAX_FOLDER_DEPTH - 1) {
						throw new Error(
							`Maximum folder depth of ${MAX_FOLDER_DEPTH} reached`
						);
					}

					const parentFolder = await db.query.documentationFolder.findFirst({
						where: eq(documentationFolder.id, input.parentFolderId),
					});

					if (
						!parentFolder ||
						parentFolder.projectId !== existingFolder.projectId
					) {
						throw new Error("Parent folder not found");
					}
				}
			}

			const { folderId, ...updateData } = input;
			return await db
				.update(documentationFolder)
				.set({ ...updateData, updatedAt: new Date() })
				.where(eq(documentationFolder.id, input.folderId))
				.returning();
		}),

	deleteFolder: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/folder/{folderId}",
			summary: "Delete a documentation folder",
			tags: ["Documentation"],
		})
		.input(z.object({ folderId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const existingFolder = await db.query.documentationFolder.findFirst({
				where: eq(documentationFolder.id, input.folderId),
			});

			if (!existingFolder) {
				throw new Error("Folder not found");
			}

			await requireMemberAccess(existingFolder.projectId, userId);

			await db
				.delete(documentationFolder)
				.where(eq(documentationFolder.id, input.folderId));

			return { success: true };
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

			const canViewPrivate =
				access === "owner" || access === "admin" || access === "member";

			const pages = await db.query.documentationPage.findMany({
				where: and(
					eq(documentationPage.projectId, input.projectId),
					canViewPrivate
						? undefined
						: eq(documentationPage.visibility, "public")
				),
				orderBy: (page, { asc }) => [asc(page.position), asc(page.title)],
				with: {
					author: {
						columns: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});

			return pages;
		}),

	getPage: protectedProcedure
		.route({
			method: "GET",
			path: "/api/page/{pageId}",
			summary: "Get a single documentation page",
			tags: ["Documentation"],
		})
		.input(z.object({ pageId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const page = await db.query.documentationPage.findFirst({
				where: eq(documentationPage.id, input.pageId),
				with: {
					author: {
						columns: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});

			if (!page) {
				throw new Error("Page not found");
			}

			const access = await getProjectAccess(page.projectId, userId);

			if (access === "none") {
				throw new Error("Project not found");
			}

			if (page.visibility === "private" && access === "viewer") {
				throw new Error("Access denied. Members only.");
			}

			return page;
		}),

	createPage: protectedProcedure
		.route({
			method: "POST",
			path: "/api/project/{projectId}/page",
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

			if (input.folderId) {
				const folder = await db.query.documentationFolder.findFirst({
					where: eq(documentationFolder.id, input.folderId),
				});

				if (!folder || folder.projectId !== input.projectId) {
					throw new Error("Folder not found");
				}
			}

			const pageId = nanoid();
			const newPage = await db
				.insert(documentationPage)
				.values({
					id: pageId,
					projectId: input.projectId,
					title: input.title,
					content: input.content,
					folderId: input.folderId || null,
					visibility: input.visibility,
					authorId: userId,
				})
				.returning();

			return newPage[0];
		}),

	updatePage: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/page/{pageId}",
			summary: "Update a documentation page",
			tags: ["Documentation"],
		})
		.input(
			z.object({
				pageId: z.string(),
				title: z.string().min(1).optional(),
				content: z.string().optional(),
				folderId: z.string().nullable().optional(),
				visibility: z.enum(["public", "private"]).optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const existingPage = await db.query.documentationPage.findFirst({
				where: eq(documentationPage.id, input.pageId),
			});

			if (!existingPage) {
				throw new Error("Page not found");
			}

			await requireMemberAccess(existingPage.projectId, userId);

			if (input.folderId !== undefined && input.folderId !== null) {
				const folder = await db.query.documentationFolder.findFirst({
					where: eq(documentationFolder.id, input.folderId),
				});

				if (!folder || folder.projectId !== existingPage.projectId) {
					throw new Error("Folder not found");
				}
			}

			const { pageId, ...updateData } = input;
			return await db
				.update(documentationPage)
				.set({ ...updateData, updatedAt: new Date() })
				.where(eq(documentationPage.id, input.pageId))
				.returning();
		}),

	deletePage: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/page/{pageId}",
			summary: "Delete a documentation page",
			tags: ["Documentation"],
		})
		.input(z.object({ pageId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const existingPage = await db.query.documentationPage.findFirst({
				where: eq(documentationPage.id, input.pageId),
			});

			if (!existingPage) {
				throw new Error("Page not found");
			}

			await requireMemberAccess(existingPage.projectId, userId);

			await db
				.delete(documentationPage)
				.where(eq(documentationPage.id, input.pageId));

			return { success: true };
		}),

	getRootPages: protectedProcedure
		.route({
			method: "GET",
			path: "/api/project/{projectId}/pages/root",
			summary: "Get root-level documentation pages (not in any folder)",
			tags: ["Documentation"],
		})
		.input(projectIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);

			if (access === "none") {
				throw new Error("Project not found");
			}

			const canViewPrivate =
				access === "owner" || access === "admin" || access === "member";

			const pages = await db.query.documentationPage.findMany({
				where: and(
					eq(documentationPage.projectId, input.projectId),
					isNull(documentationPage.folderId),
					canViewPrivate
						? undefined
						: eq(documentationPage.visibility, "public")
				),
				orderBy: (page, { asc }) => [asc(page.position), asc(page.title)],
				with: {
					author: {
						columns: {
							id: true,
							name: true,
							image: true,
						},
					},
				},
			});

			return pages;
		}),
};
