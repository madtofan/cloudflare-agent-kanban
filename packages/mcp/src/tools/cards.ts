import { getProjectAccess } from "@cloudflare-agent-kanban/api/utils";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpAuthContext } from "../auth";
import {
	archiveCard,
	createCard,
	deleteCard,
	getCard,
	getCardsByBoardId,
	getCardsByColumnId,
	moveCard,
	searchCards,
	updateCard,
} from "../utils/do-client";
import {
	archiveCardInput,
	assertProjectScope,
	createCardInput,
	deleteCardInput,
	getCardInput,
	listCardsInput,
	moveCardInput,
	searchCardsInput,
	updateCardInput,
} from "../utils/schemas";

async function requireEditAccess(projectId: string, userId: string) {
	const access = await getProjectAccess(projectId, userId);
	if (access === "none" || access === "viewer") {
		throw new Error(
			"Access denied: you do not have edit access to this project"
		);
	}
}

export function registerCardTools(
	server: McpServer,
	auth: McpAuthContext,
	env: Record<string, unknown>
) {
	server.registerTool(
		"get_card",
		{
			description: "Get detailed information about a specific card by its ID",
			inputSchema: getCardInput,
		},
		async (input) => {
			assertProjectScope(auth, input.projectId);
			const result = await getCard(env, input.projectId, input.cardId);
			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		}
	);

	server.registerTool(
		"list_cards",
		{
			description:
				"List cards in a project, optionally filtered by board or column",
			inputSchema: listCardsInput,
		},
		async (input) => {
			assertProjectScope(auth, input.projectId);
			if (input.columnId) {
				const cards = await getCardsByColumnId(
					env,
					input.projectId,
					input.columnId
				);
				return {
					content: [{ type: "text", text: JSON.stringify(cards, null, 2) }],
				};
			}

			if (input.boardId) {
				const cardsByColumn = await getCardsByBoardId(
					env,
					input.projectId,
					input.boardId
				);
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(cardsByColumn, null, 2),
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: "Provide either boardId or columnId to list cards",
					},
				],
			};
		}
	);

	server.registerTool(
		"search_cards",
		{
			description: "Search cards in a board by title or card number",
			inputSchema: searchCardsInput,
		},
		async (input) => {
			assertProjectScope(auth, input.projectId);
			const results = await searchCards(
				env,
				input.projectId,
				input.boardId,
				input.query
			);
			return {
				content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
			};
		}
	);

	server.registerTool(
		"create_card",
		{
			description:
				"Create a new card in a specific column. Minimum 5 characters for title.",
			inputSchema: createCardInput,
		},
		async (input) => {
			assertProjectScope(auth, input.projectId);
			await requireEditAccess(input.projectId, auth.user.id);

			const result = await createCard(env, input.projectId, {
				columnId: input.columnId,
				userId: auth.user.id,
				title: input.title,
				type: input.type,
				description: input.description,
				acceptanceCriteria: input.acceptanceCriteria,
				assigneeId: input.assigneeId,
			});

			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		}
	);

	server.registerTool(
		"update_card",
		{
			description: "Update one or more fields of an existing card",
			inputSchema: updateCardInput,
		},
		async (input) => {
			assertProjectScope(auth, input.projectId);
			await requireEditAccess(input.projectId, auth.user.id);

			const result = await updateCard(env, input.projectId, {
				cardId: input.cardId,
				userId: auth.user.id,
				title: input.title,
				type: input.type,
				description: input.description,
				acceptanceCriteria: input.acceptanceCriteria,
				position: input.position,
				assigneeId: input.assigneeId,
				agentTriggerUrl: input.agentTriggerUrl,
			});

			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		}
	);

	server.registerTool(
		"delete_card",
		{
			description: "Permanently delete a card and its associated data",
			inputSchema: deleteCardInput,
		},
		async (input) => {
			assertProjectScope(auth, input.projectId);
			await requireEditAccess(input.projectId, auth.user.id);

			const result = await deleteCard(
				env,
				input.projectId,
				input.cardId,
				auth.user.id
			);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		}
	);

	server.registerTool(
		"move_card",
		{
			description:
				"Move a card to a different column and/or position within the board",
			inputSchema: moveCardInput,
		},
		async (input) => {
			assertProjectScope(auth, input.projectId);
			await requireEditAccess(input.projectId, auth.user.id);

			const result = await moveCard(env, input.projectId, {
				cardId: input.cardId,
				userId: auth.user.id,
				newColumnId: input.columnId,
				newPosition: input.position,
			});

			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		}
	);

	server.registerTool(
		"archive_card",
		{
			description: "Archive a card to hide it from the active board",
			inputSchema: archiveCardInput,
		},
		async (input) => {
			assertProjectScope(auth, input.projectId);
			await requireEditAccess(input.projectId, auth.user.id);

			const result = await archiveCard(
				env,
				input.projectId,
				input.cardId,
				auth.user.id
			);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		}
	);
}
