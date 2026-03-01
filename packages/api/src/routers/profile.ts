import { db } from "@cloudflare-agent-kanban/db";
import { user, userProfile } from "@cloudflare-agent-kanban/db/schema/auth";
import {
	project,
	projectMember,
} from "@cloudflare-agent-kanban/db/schema/kanban";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";
import { protectedProcedure, publicProcedure } from "../index";

const usernameRegex = /^[a-z0-9_-]{6,30}$/;

const updateProfileSchema = z.object({
	aboutMe: z.string().max(500).optional(),
	showcasedProjectIds: z.array(z.string()).optional(),
});

export const profileRouter = {
	getByUsername: publicProcedure
		.route({
			method: "GET",
			path: "/api/profile/{username}",
			summary: "",
			tags: ["Profile"],
		})
		.input(z.object({ username: z.string() }))
		.handler(async ({ input }) => {
			const { username } = input;

			const userData = await db.query.user.findFirst({
				where: eq(user.username, username.toLowerCase()),
			});

			if (!userData) {
				throw new Error("User not found");
			}

			const profileData = await db.query.userProfile.findFirst({
				where: eq(userProfile.userId, userData.id),
			});

			const projectIds = JSON.parse(
				profileData?.showcasedProjectIds ?? "[]"
			) as string[];

			const showcasedProjects = await db.query.project.findMany({
				where: and(
					inArray(project.id, projectIds),
					eq(project.visibility, "public")
				),
				with: {
					owner: {
						columns: {
							id: true,
							name: true,
							username: true,
							image: true,
						},
					},
				},
			});

			return {
				id: userData.id,
				name: userData.name,
				username: userData.username,
				displayUsername: userData.displayUsername,
				image: userData.image,
				aboutMe: profileData?.aboutMe || null,
				showcasedProjects,
			};
		}),

	getMyProfile: protectedProcedure
		.route({
			method: "GET",
			path: "/api/profile",
			summary: "",
			tags: ["Profile"],
		})
		.handler(async ({ context }) => {
			const userId = context.session.user.id;

			const userData = await db.query.user.findFirst({
				where: eq(user.id, userId),
				columns: {
					id: true,
					name: true,
					email: true,
					username: true,
					displayUsername: true,
					image: true,
				},
			});

			if (!userData) {
				throw new Error("User not found");
			}

			const profileData = await db.query.userProfile.findFirst({
				where: eq(userProfile.userId, userId),
			});

			const memberProjects = await db
				.select({ project })
				.from(projectMember)
				.innerJoin(project, eq(projectMember.projectId, project.id))
				.where(eq(projectMember.userId, userId));

			const ownedProjects = await db.query.project.findMany({
				where: eq(project.ownerId, userId),
			});

			const allProjects = [
				...memberProjects.map((m) => m.project),
				...ownedProjects,
			];
			const uniqueProjects = allProjects.filter(
				(project, index, self) =>
					index === self.findIndex((p) => p.id === project.id)
			);

			const publicProjects = uniqueProjects.filter(
				(p) => p.visibility === "public"
			);

			return {
				...userData,
				aboutMe: profileData?.aboutMe || null,
				showcasedProjectIds: profileData?.showcasedProjectIds
					? JSON.parse(profileData.showcasedProjectIds)
					: [],
				publicProjects,
			};
		}),

	updateProfile: protectedProcedure
		.route({
			method: "PUT",
			path: "/api/profile",
			summary: "",
			tags: ["Profile"],
		})
		.input(updateProfileSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const existingProfile = await db.query.userProfile.findFirst({
				where: eq(userProfile.userId, userId),
			});

			if (existingProfile) {
				await db
					.update(userProfile)
					.set({
						aboutMe: input.aboutMe ?? existingProfile.aboutMe,
						showcasedProjectIds: input.showcasedProjectIds
							? JSON.stringify(input.showcasedProjectIds)
							: existingProfile.showcasedProjectIds,
						updatedAt: new Date(),
					})
					.where(eq(userProfile.userId, userId));
			} else {
				await db.insert(userProfile).values({
					id: nanoid(),
					userId,
					aboutMe: input.aboutMe || null,
					showcasedProjectIds: input.showcasedProjectIds
						? JSON.stringify(input.showcasedProjectIds)
						: null,
				});
			}

			return { success: true };
		}),

	checkUsernameAvailability: publicProcedure
		.route({
			method: "GET",
			path: "/api/profile/check-username",
			summary: "",
			tags: ["Profile"],
		})
		.input(z.object({ username: z.string() }))
		.handler(async ({ input }) => {
			const { username } = input;

			if (!usernameRegex.test(username)) {
				return { available: false, reason: "invalid_format" };
			}

			const existingUser = await db.query.user.findFirst({
				where: eq(user.username, username.toLowerCase()),
			});

			return {
				available: !existingUser,
				reason: existingUser ? "already_taken" : null,
			};
		}),

	getPublicProjects: protectedProcedure
		.route({
			method: "GET",
			path: "/api/profile/projects",
			summary: "",
			tags: ["Profile"],
		})
		.handler(async ({ context }) => {
			const userId = context.session.user.id;

			const memberProjects = await db
				.select({ project })
				.from(projectMember)
				.innerJoin(project, eq(projectMember.projectId, project.id))
				.where(eq(projectMember.userId, userId));

			const ownedProjects = await db.query.project.findMany({
				where: eq(project.ownerId, userId),
			});

			const allProjects = [
				...memberProjects.map((m) => m.project),
				...ownedProjects,
			];
			const uniqueProjects = allProjects.filter(
				(project, index, self) =>
					index === self.findIndex((p) => p.id === project.id)
			);

			return uniqueProjects.filter((p) => p.visibility === "public");
		}),
};
