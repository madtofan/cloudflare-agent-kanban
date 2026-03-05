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

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const IMAGE_TYPE_REGEX = /^data:(image\/\w+);base64,/;
const BASE64_DATA_REGEX = /^data:image\/\w+;base64,/;

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

	uploadProfileImage: protectedProcedure
		.route({
			method: "POST",
			path: "/api/profile/upload-image",
			summary: "Upload profile image",
			tags: ["Profile"],
		})
		.input(
			z.object({
				image: z.string().describe("Base64 encoded image data"),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const r2Bucket = context.env.R2_BUCKET;
			const r2PublicUrl = context.env.R2_PUBLIC_URL;

			if (!r2Bucket) {
				throw new Error("R2 bucket not configured");
			}

			const base64Data = input.image.replace(BASE64_DATA_REGEX, "");
			const imageBuffer = Uint8Array.from(atob(base64Data), (c) =>
				c.charCodeAt(0)
			);

			const mimeTypeMatch = IMAGE_TYPE_REGEX.exec(input.image);
			const extractedMimeType = mimeTypeMatch?.[1];
			const mimeType = extractedMimeType ?? "image/jpeg";

			if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
				throw new Error("Invalid image type. Allowed types: JPEG, PNG, WebP");
			}

			if (imageBuffer.length > MAX_FILE_SIZE) {
				throw new Error("File size exceeds 5MB limit");
			}

			const extension = mimeType.split("/")[1] ?? "jpg";
			const key = `avatars/${userId}/${Date.now()}.${extension}`;

			await r2Bucket.put(key, imageBuffer, {
				httpMetadata: {
					contentType: mimeType,
				},
			});

			const currentUser = await db.query.user.findFirst({
				where: eq(user.id, userId),
				columns: { image: true },
			});

			if (currentUser?.image?.startsWith("avatars/")) {
				const oldKey = currentUser.image;
				try {
					await r2Bucket.delete(oldKey);
				} catch {
					// Ignore deletion errors for old images
				}
			}

			const imageUrl = r2PublicUrl ? `${r2PublicUrl}/${key}` : key;

			await db
				.update(user)
				.set({ image: key, updatedAt: new Date() })
				.where(eq(user.id, userId));

			return { imageUrl };
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
