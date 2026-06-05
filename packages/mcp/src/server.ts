import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpAuthContext } from "./auth";
import { registerTools } from "./tools";

export function createServer(
	auth: McpAuthContext,
	env: Record<string, unknown>
): McpServer {
	const server = new McpServer({
		name: "cloudflare-agent-kanban",
		version: "1.0.0",
	});

	registerTools(server, auth, env);

	return server;
}
