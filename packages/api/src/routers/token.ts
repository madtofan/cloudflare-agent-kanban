import { db } from "@cloudflare-agent-kanban/db";
import { apiToken } from "@cloudflare-agent-kanban/db/schema/kanban";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import z from "zod";
import { protectedProcedure } from "../index";
import { generateToken, getPartialToken, hashToken } from "../utils";
import { requireEditAccess } from "./project";

function calculateExpiry(expiresInDays: number | null): Date | null {
	if (!expiresInDays) {
		return null;
	}
	const date = new Date();
	date.setDate(date.getDate() + expiresInDays);
	return date;
}

export const tokenRouter = {
	listTokens: protectedProcedure
		.route({
			method: "GET",
			path: "/api/token",
			summary: "List all API tokens for the current user",
			description: "Returns all API tokens created by the authenticated user, including their name, partial token, and expiration.",
			tags: ["Token"],
		})
		.handler(async ({ context }) => {
			const userId = context.session.user.id;

			const tokens = await db.query.apiToken.findMany({
				where: eq(apiToken.userId, userId),
				columns: {
					id: true,
					name: true,
					partialToken: true,
					expiresAt: true,
					lastUsedAt: true,
					createdAt: true,
				},
				with: {
					project: {
						columns: {
							id: true,
							name: true,
						},
					},
				},
				orderBy: (token, { desc }) => desc(token.createdAt),
			});

			return tokens;
		}),

	createToken: protectedProcedure
		.route({
			method: "POST",
			path: "/api/token",
			summary: "Create a new API token",
			description: "Creates a new API token for programmatic access to a specific project. The raw token is returned only once at creation.",
			tags: ["Token"],
		})
		.input(
			z.object({
				name: z.string().min(1).max(100),
				projectId: z.string(),
				expiresInDays: z.union([z.null(), z.number()]).optional().default(null),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			await requireEditAccess(input.projectId, userId);

			const rawToken = generateToken();
			const tokenHash = await hashToken(rawToken);

			await db.insert(apiToken).values({
				id: nanoid(),
				userId,
				name: input.name,
				projectId: input.projectId,
				tokenHash,
				partialToken: getPartialToken(rawToken),
				expiresAt: calculateExpiry(input.expiresInDays),
			});

			return {
				token: rawToken,
				partialToken: getPartialToken(rawToken),
			};
		}),

	revokeToken: protectedProcedure
		.route({
			method: "DELETE",
			path: "/api/token/{tokenId}",
			summary: "Revoke an API token",
			description: "Permanently revokes an API token. Users can only revoke their own tokens.",
			tags: ["Token"],
		})
		.input(z.object({ tokenId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const existing = await db.query.apiToken.findFirst({
				where: eq(apiToken.id, input.tokenId),
				columns: { userId: true },
			});

			if (!existing) {
				throw new Error("Token not found");
			}

			if (existing.userId !== userId) {
				throw new Error("You can only revoke your own tokens");
			}

			await db.delete(apiToken).where(eq(apiToken.id, input.tokenId));

			return { success: true };
		}),
};
