import { db } from "@cloudflare-agent-kanban/db";
import {
	project,
	projectMember,
} from "@cloudflare-agent-kanban/db/schema/kanban";
import { and, eq } from "drizzle-orm";

export type ProjectAccess = "owner" | "admin" | "member" | "viewer" | "none";

export async function getProjectAccess(
	projectId: string,
	userId: string | null
): Promise<ProjectAccess> {
	const projectData = await db.query.project.findFirst({
		where: eq(project.id, projectId),
	});

	if (!projectData) {
		return "none";
	}

	if (projectData.ownerId === userId) {
		return "owner";
	}

	if (!userId) {
		return projectData.visibility === "public" ? "viewer" : "none";
	}

	const member = await db.query.projectMember.findFirst({
		where: and(
			eq(projectMember.projectId, projectId),
			eq(projectMember.userId, userId)
		),
	});

	if (!member) {
		return projectData.visibility === "public" ? "viewer" : "none";
	}

	return member.role === "admin" ? "admin" : "member";
}
