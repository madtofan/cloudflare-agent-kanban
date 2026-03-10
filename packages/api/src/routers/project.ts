import { db } from "@cloudflare-agent-kanban/db";
import { user as userTable } from "@cloudflare-agent-kanban/db/schema/auth";
import {
	board,
	project,
	projectMember,
} from "@cloudflare-agent-kanban/db/schema/kanban";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";
import { protectedProcedure } from "../index";
import { getProjectAccess, type ProjectAccess } from "../utils";

const projectIdSchema = z.object({ projectId: z.string() });

export async function requireEditAccess(
	projectId: string,
	userId: string
): Promise<ProjectAccess> {
	const access = await getProjectAccess(projectId, userId);
	if (access === "none" || access === "viewer") {
		throw new Error("Access denied");
	}
	return access;
}

export const projectRouter = {
	getAll: protectedProcedure
		.route({
			method: "GET",
			path: "/api/project",
			summary: "",
			tags: ["Project"],
		})
		.handler(async ({ context }) => {
			const userId = context.session.user.id;

			const memberProjects = await db.query.project.findMany({
				where: (project, { exists, and, eq }) =>
					exists(
						db
							.select()
							.from(projectMember)
							.where(
								and(
									eq(projectMember.projectId, project.id),
									eq(projectMember.userId, userId)
								)
							)
					),
			});

			const ownedProjects = await db.query.project.findMany({
				where: (project, { eq }) => eq(project.ownerId, userId),
			});

			const allProjects = [
				...memberProjects,
				...ownedProjects,
			];
			const uniqueProjects = allProjects.filter(
				(project, index, self) =>
					index === self.findIndex((p) => p.id === project.id)
			);

			return uniqueProjects;
		}),

	getById: protectedProcedure
		.route({
			method: "GET",
			path: "/api/project/{projectId}",
			summary: "",
			tags: ["Project"],
		})
		.input(projectIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);

			if (access === "none") {
				throw new Error("Project not found");
			}

			const projectData = await db.query.project.findFirst({
				where: eq(project.id, input.projectId),
			});

			if (!projectData) {
				throw new Error("Project not found");
			}

			return projectData;
		}),

	getBoards: protectedProcedure
		.route({
			method: "GET",
			path: "/api/project/{projectId}/boards",
			summary: "",
			tags: ["Project"],
		})
		.input(projectIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);

			if (access === "none") {
				throw new Error("Project not found");
			}

			const boards = await db.query.board.findMany({
				where: eq(board.projectId, input.projectId),
			});

			return boards;
		}),

	create: protectedProcedure
		.route({
			method: "POST",
			path: "/api/project",
			summary: "",
			tags: ["Project"],
		})
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().optional(),
				visibility: z.enum(["private", "public"]).default("private"),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const projectId = nanoid();

			const newProject = await db
				.insert(project)
				.values({
					id: projectId,
					name: input.name,
					description: input.description,
					visibility: input.visibility,
					ownerId: userId,
				})
				.returning();

			await db.insert(projectMember).values({
				id: nanoid(),
				projectId,
				userId,
				role: "admin",
			});

			return newProject[0];
		}),

	update: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/project/{projectId}",
			summary: "",
			tags: ["Project"],
		})
		.input(
			projectIdSchema.extend({
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				visibility: z.enum(["private", "public"]).optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await requireEditAccess(input.projectId, userId);

			if (access !== "owner" && access !== "admin") {
				throw new Error("Only owner and admins can update the project");
			}

			const projectData = await db.query.project.findFirst({
				where: eq(project.id, input.projectId),
			});

			if (!projectData) {
				throw new Error("Project not found");
			}

			const { projectId, ...updateData } = input;
			return await db
				.update(project)
				.set({ ...updateData, updatedAt: new Date() })
				.where(eq(project.id, input.projectId))
				.returning();
		}),

	delete: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/project/{projectId}",
			summary: "",
			tags: ["Project"],
		})
		.input(projectIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await requireEditAccess(input.projectId, userId);

			if (access !== "owner") {
				throw new Error("Only the owner can delete the project");
			}

			await db.delete(project).where(eq(project.id, input.projectId));
			return { success: true };
		}),

	getMembers: protectedProcedure
		.route({
			method: "GET",
			path: "/api/project/{projectId}/members",
			summary: "",
			tags: ["Project"],
		})
		.input(projectIdSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await getProjectAccess(input.projectId, userId);

			if (access === "none") {
				throw new Error("Project not found");
			}

			const [projectData, members] = await Promise.all([
				db.query.project.findFirst({
					where: eq(project.id, input.projectId),
					columns: {
						ownerId: true,
					},
					with: {
						owner: {
							columns: {
								id: true,
								name: true,
								image: true,
								email: true,
							},
						},
					},
				}),
				db.query.projectMember.findMany({
					where: eq(projectMember.projectId, input.projectId),
					columns: {
						id: true,
						role: true,
					},
					with: {
						user: {
							columns: {
								id: true,
								name: true,
								image: true,
								email: true,
							},
						},
					},
				}),
			]);

			return {
				owner: projectData?.owner,
				members,
			};
		}),

	addMember: protectedProcedure
		.route({
			method: "POST",
			path: "/api/project/{projectId}/members",
			summary: "",
			tags: ["Project"],
		})
		.input(
			projectIdSchema.extend({
				email: z.email(),
				role: z.enum(["admin", "member"]).default("member"),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await requireEditAccess(input.projectId, userId);

			if (access !== "owner" && access !== "admin") {
				throw new Error("Only owner and admins can add members");
			}

			const projectData = await db.query.project.findFirst({
				where: eq(project.id, input.projectId),
			});

			if (!projectData) {
				throw new Error("Project not found");
			}

			const userToAdd = await db.query.user.findFirst({
				where: eq(userTable.email, input.email),
			});

			if (!userToAdd) {
				throw new Error("User not found with this email");
			}

			if (projectData.ownerId === userToAdd.id) {
				throw new Error("Cannot add owner as a member");
			}

			const existingMember = await db.query.projectMember.findFirst({
				where: and(
					eq(projectMember.projectId, input.projectId),
					eq(projectMember.userId, userToAdd.id)
				),
			});

			if (existingMember) {
				throw new Error("User is already a member of this project");
			}

			await db.insert(projectMember).values({
				id: nanoid(),
				projectId: input.projectId,
				userId: userToAdd.id,
				role: input.role,
			});

			return { success: true, message: "Member added" };
		}),

	removeMember: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/project/{projectId}/members",
			summary: "",
			tags: ["Project"],
		})
		.input(
			projectIdSchema.extend({
				memberId: z.string(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await requireEditAccess(input.projectId, userId);

			if (access !== "owner" && access !== "admin") {
				throw new Error("Only owner and admins can remove members");
			}

			const memberToRemove = await db.query.projectMember.findFirst({
				where: eq(projectMember.id, input.memberId),
			});

			if (!memberToRemove) {
				throw new Error("Member not found");
			}

			if (memberToRemove.projectId !== input.projectId) {
				throw new Error("Member does not belong to this project");
			}

			const projectData = await db.query.project.findFirst({
				where: eq(project.id, input.projectId),
			});

			if (!projectData) {
				throw new Error("Project not found");
			}

			if (memberToRemove.userId === projectData.ownerId) {
				throw new Error("Cannot remove the owner from the project");
			}

			if (
				access === "admin" &&
				memberToRemove.role === "admin" &&
				memberToRemove.userId !== userId
			) {
				throw new Error("Admins cannot remove other admins");
			}

			await db
				.delete(projectMember)
				.where(eq(projectMember.id, input.memberId));

			return { success: true, message: "Member removed" };
		}),

	updateMemberRole: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/project/{projectId}/members/{memberId}",
			summary: "",
			tags: ["Project"],
		})
		.input(
			projectIdSchema.extend({
				memberId: z.string(),
				role: z.enum(["admin", "member"]),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const access = await requireEditAccess(input.projectId, userId);

			if (access !== "owner" && access !== "admin") {
				throw new Error("Only owner and admins can update member roles");
			}

			const memberToUpdate = await db.query.projectMember.findFirst({
				where: eq(projectMember.id, input.memberId),
			});

			if (!memberToUpdate) {
				throw new Error("Member not found");
			}

			if (memberToUpdate.projectId !== input.projectId) {
				throw new Error("Member does not belong to this project");
			}

			const projectData = await db.query.project.findFirst({
				where: eq(project.id, input.projectId),
			});

			if (!projectData) {
				throw new Error("Project not found");
			}

			if (memberToUpdate.userId === projectData.ownerId) {
				throw new Error("Cannot change the role of the owner");
			}

			if (
				access === "admin" &&
				memberToUpdate.role === "admin" &&
				memberToUpdate.userId !== userId
			) {
				throw new Error("Admins cannot change roles of other admins");
			}

			await db
				.update(projectMember)
				.set({ role: input.role })
				.where(eq(projectMember.id, input.memberId));

			return { success: true, message: "Member role updated" };
		}),
};
