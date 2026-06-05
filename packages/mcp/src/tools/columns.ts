import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpAuthContext } from "../auth";
import { getColumns } from "../utils/do-client";
import { listColumnsInput } from "../utils/schemas";

export function registerColumnTools(
	server: McpServer,
	_auth: McpAuthContext,
	env: Record<string, unknown>
) {
	server.registerTool(
		"list_columns",
		{
			description: "List all columns in a board",
			inputSchema: listColumnsInput,
		},
		async (input) => {
			const columns = await getColumns(env, input.projectId, input.boardId);

			const result = columns.map((c) => ({
				id: c.id,
				name: c.name,
				position: c.position,
				boardId: c.boardId,
			}));

			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		}
	);
}
