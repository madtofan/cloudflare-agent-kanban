import { db } from "@cloudflare-agent-kanban/db";
import { apiToken } from "@cloudflare-agent-kanban/db/schema/kanban";
import { eq } from "drizzle-orm";

const TOKEN_PREFIX = "kan_";

export function generateToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return (
		TOKEN_PREFIX +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
}

export async function hashToken(token: string): Promise<string> {
	const encoder = new TextEncoder();
	const hash = await crypto.subtle.digest("SHA-256", encoder.encode(token));
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export function isApiToken(token: string): boolean {
	return token.startsWith(TOKEN_PREFIX);
}

export function getPartialToken(token: string): string {
	return `…${token.slice(-6)}`;
}

export interface ValidatedApiToken {
	email: string;
	image: string | null;
	name: string;
	projectId: string;
	userId: string;
}

export async function validateApiToken(
	token: string
): Promise<ValidatedApiToken | null> {
	if (!isApiToken(token)) {
		return null;
	}

	const hash = await hashToken(token);

	const record = await db.query.apiToken.findFirst({
		where: eq(apiToken.tokenHash, hash),
		with: { user: true },
	});

	if (!record) {
		return null;
	}

	if (record.expiresAt && record.expiresAt < new Date()) {
		return null;
	}

	await db
		.update(apiToken)
		.set({ lastUsedAt: new Date() })
		.where(eq(apiToken.id, record.id));

	return {
		userId: record.user.id,
		name: record.user.name,
		email: record.user.email,
		image: record.user.image,
		projectId: record.projectId,
	};
}
