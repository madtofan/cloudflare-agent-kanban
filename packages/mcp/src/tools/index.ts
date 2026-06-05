import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpAuthContext } from "../auth";
import { registerBoardTools } from "./boards";
import { registerCardTools } from "./cards";
import { registerColumnTools } from "./columns";
import { registerCommentTools } from "./comments";
import { registerProjectTools } from "./projects";

export function registerTools(
	server: McpServer,
	auth: McpAuthContext,
	env: Record<string, unknown>
) {
	registerProjectTools(server, auth, env);
	registerBoardTools(server, auth, env);
	registerColumnTools(server, auth, env);
	registerCardTools(server, auth, env);
	registerCommentTools(server, auth, env);
}
