// biome-ignore-all lint/suspicious/noExplicitAny: env
import { auth } from "@cloudflare-agent-kanban/auth";
import type { Context as HonoContext } from "hono";

export interface CreateContextOptions {
	context: HonoContext;
}

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	return {
		session,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		env: context.env as any,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
