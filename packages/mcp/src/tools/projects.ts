import { db } from "@cloudflare-agent-kanban/db";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eq, inArray } from "drizzle-orm";
import type { McpAuthContext } from "../auth";
import { listProjectsInput } from "../utils/schemas";

export function registerProjectTools(
	server: McpServer,
	auth: McpAuthContext,
	_env: Record<string, unknown>
) {
	server.registerTool(
		"list_projects",
		{
			description:
				"List all projects the authenticated user has access to (as owner or member)",
			inputSchema: listProjectsInput,
		},
		async () => {
			const userId = auth.user.id;

			const membershipRows = await db.query.projectMember.findMany({
				where: (fields, { eq }) => eq(fields.userId, userId),
				columns: { projectId: true },
			});
			const memberProjectIds = membershipRows.map((r) => r.projectId);

			const accessibleProjects = await db.query.project.findMany({
				where: (fields, { or }) =>
					or(
						eq(fields.ownerId, userId),
						inArray(fields.id, memberProjectIds)
					),
			});

			const projectsWithRole = accessibleProjects.map((p) => ({
				id: p.id,
				name: p.name,
				description: p.description,
				visibility: p.visibility,
				role: p.ownerId === userId ? "owner" : "member",
			}));

			return {
				content: [
					{ type: "text", text: JSON.stringify(projectsWithRole, null, 2) },
				],
			};
		}
	);
}
