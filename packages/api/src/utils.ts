import { db } from "@cloudflare-agent-kanban/db";
import {
	board,
	project,
	projectMember,
} from "@cloudflare-agent-kanban/db/schema/kanban";
import { and, eq } from "drizzle-orm";

export type ProjectAccess = "owner" | "admin" | "member" | "viewer" | "none";
export type BoardAccess = "owner" | "admin" | "member" | "viewer" | "none";

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

export async function getBoardAccess(
	boardId: string,
	userId: string | null
): Promise<BoardAccess> {
	const boardData = await db.query.board.findFirst({
		where: eq(board.id, boardId),
	});

	if (!boardData) {
		return "none";
	}

	if (boardData.ownerId === userId) {
		return "owner";
	}

	if (!userId) {
		return boardData.visibility === "public" ? "viewer" : "none";
	}

	if (boardData.projectId) {
		const projectAccess = await getProjectAccess(boardData.projectId, userId);
		if (projectAccess !== "none" && projectAccess !== "viewer") {
			return projectAccess as BoardAccess;
		}
	}

	return boardData.visibility === "public" ? "viewer" : "none";
}
