import z from "zod";
import type { McpAuthContext } from "../auth";

export function assertProjectScope(
	auth: McpAuthContext,
	projectId: string
): void {
	if (auth.tokenProjectId && auth.tokenProjectId !== projectId) {
		throw new Error(
			`Token is scoped to project ${auth.tokenProjectId}, but tried to access project ${projectId}`
		);
	}
}

export const projectId = z.string().describe("The ID of the project");
export const boardId = z.string().describe("The ID of the board");
export const columnId = z.string().describe("The ID of the column");
export const cardId = z.string().describe("The ID of the card");

export const cardType = z.enum([
	"epic",
	"feature",
	"user_story",
	"bug",
	"task",
]);

export const listProjectsInput = z.object({});

export const listBoardsInput = z.object({
	projectId,
});

export const listColumnsInput = z.object({
	projectId,
	boardId,
});

export const getCardInput = z.object({
	projectId,
	cardId,
});

export const listCardsInput = z.object({
	projectId,
	boardId: z.string().optional().describe("Filter by board ID"),
	columnId: z.string().optional().describe("Filter by column ID"),
});

export const searchCardsInput = z.object({
	projectId,
	boardId,
	query: z
		.string()
		.min(1)
		.describe("Search query to match against card title or number"),
});

export const createCardInput = z.object({
	projectId,
	columnId,
	title: z.string().min(5).describe("The card title (min 5 characters)"),
	type: cardType.describe("The card type"),
	description: z.string().optional().describe("Card description in markdown"),
	acceptanceCriteria: z
		.string()
		.optional()
		.describe("Acceptance criteria in markdown"),
	assigneeId: z.string().optional().describe("User ID to assign this card to"),
});

export const updateCardInput = z.object({
	projectId,
	cardId,
	title: z.string().min(1).optional().describe("New title"),
	type: cardType.optional().describe("New card type"),
	description: z.string().optional().describe("New description in markdown"),
	acceptanceCriteria: z
		.string()
		.optional()
		.describe("New acceptance criteria in markdown"),
	columnId: z.string().optional().describe("Move to a different column"),
	position: z.number().optional().describe("New position within the column"),
	assigneeId: z
		.string()
		.nullable()
		.optional()
		.describe("User ID to assign, or null to unassign"),
	agentTriggerUrl: z
		.string()
		.nullable()
		.optional()
		.describe("External agent webhook URL, or null to remove"),
});

export const deleteCardInput = z.object({
	projectId,
	cardId,
});

export const moveCardInput = z.object({
	projectId,
	cardId,
	columnId: z.string().describe("Destination column ID"),
	position: z
		.number()
		.min(0)
		.describe("Position within the destination column (0-based)"),
});

export const archiveCardInput = z.object({
	projectId,
	cardId,
});

export const addCommentInput = z.object({
	projectId,
	cardId,
	content: z.string().min(1).describe("Comment content (supports @mentions)"),
});

export const projectResult = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	visibility: z.enum(["private", "public"]),
	role: z.string(),
});
