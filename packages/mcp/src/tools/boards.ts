import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpAuthContext } from "../auth";
import { getBoards } from "../utils/do-client";
import { listBoardsInput } from "../utils/schemas";

export function registerBoardTools(
	server: McpServer,
	_auth: McpAuthContext,
	env: Record<string, unknown>
) {
	server.registerTool(
		"list_boards",
		{
			description: "List all boards in a project",
			inputSchema: listBoardsInput,
		},
		async (input) => {
			const boards = await getBoards(env, input.projectId);

			const result = boards.map((b) => ({
				id: b.id,
				name: b.name,
				description: b.description,
				visibility: b.visibility,
				ownerId: b.ownerId,
			}));

			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		}
	);
}
