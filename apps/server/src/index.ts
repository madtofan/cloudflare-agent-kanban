export { ProjectDO } from "@cloudflare-agent-kanban/do";

import { createContext } from "@cloudflare-agent-kanban/api/context";
import { appRouter } from "@cloudflare-agent-kanban/api/routers/index";
import { auth } from "@cloudflare-agent-kanban/auth";
import { env } from "@cloudflare-agent-kanban/env/server";
import {
	createMcpHandler,
	createServer,
	validateSession,
} from "@cloudflare-agent-kanban/mcp";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { BatchHandlerPlugin } from "@orpc/server/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handleSeed } from "./seed";

const app = new Hono<{ Bindings: Env }>();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "PUT", "OPTIONS", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization", "x-orpc-batch"],
		credentials: true,
	})
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/api/dev/seed", handleSeed);

app.use("/mcp", async (c) => {
	try {
		const authContext = await validateSession(c.req.raw);

		const server = createServer(authContext, c.env);

		return createMcpHandler(server)(c.req.raw, c.env, c.executionCtx);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Authentication failed";
		return new Response(JSON.stringify({ error: message }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}
});

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
		new BatchHandlerPlugin(),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter, {
	plugins: [new BatchHandlerPlugin()],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

app.use("/*", async (c, next) => {
	const context = await createContext({ context: c });

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context,
	});

	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api-reference",
		context,
	});

	if (apiResult.matched) {
		return c.newResponse(apiResult.response.body, apiResult.response);
	}

	await next();
});

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
