import { getProjectAccess } from "@cloudflare-agent-kanban/api/utils";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpAuthContext } from "../auth";
import { createComment } from "../utils/do-client";
import { addCommentInput, assertProjectScope } from "../utils/schemas";

export function registerCommentTools(
	server: McpServer,
	auth: McpAuthContext,
	env: Record<string, unknown>
) {
	server.registerTool(
		"add_comment",
		{
			description:
				"Add a comment to a card. Supports @mentions for notifying users.",
			inputSchema: addCommentInput,
		},
		async (input) => {
			assertProjectScope(auth, input.projectId);
			const access = await getProjectAccess(input.projectId, auth.user.id);
			if (access === "none" || access === "viewer") {
				throw new Error(
					"Access denied: you do not have access to comment on this card"
				);
			}

			const result = await createComment(env, input.projectId, {
				cardId: input.cardId,
				userId: auth.user.id,
				content: input.content,
			});

			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		}
	);
}
