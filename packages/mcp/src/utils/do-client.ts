import {
	type CardData,
	callDo,
	type DoMethodReturnTypes,
} from "@cloudflare-agent-kanban/api/do-client";

export function getBoards(
	env: Record<string, unknown>,
	projectId: string
): Promise<DoMethodReturnTypes["getBoards"]> {
	return callDo(env, projectId, "getBoards");
}

export function getColumns(
	env: Record<string, unknown>,
	projectId: string,
	boardId: string
): Promise<DoMethodReturnTypes["getColumns"]> {
	return callDo(env, projectId, "getColumns", { boardId });
}

export function getCard(
	env: Record<string, unknown>,
	projectId: string,
	cardId: string
): Promise<DoMethodReturnTypes["getCard"]> {
	return callDo(env, projectId, "getCard", { cardId });
}

export function getCardsByBoardId(
	env: Record<string, unknown>,
	projectId: string,
	boardId: string
): Promise<DoMethodReturnTypes["getCardsByBoardId"]> {
	return callDo(env, projectId, "getCardsByBoardId", { boardId });
}

export function getCardsByColumnId(
	env: Record<string, unknown>,
	projectId: string,
	columnId: string
): Promise<DoMethodReturnTypes["getCardsByColumnId"]> {
	return callDo(env, projectId, "getCardsByColumnId", { columnId });
}

export function searchCards(
	env: Record<string, unknown>,
	projectId: string,
	boardId: string,
	query: string,
	excludeCardId?: string
): Promise<DoMethodReturnTypes["searchCards"]> {
	return callDo(env, projectId, "searchCards", {
		boardId,
		query,
		excludeCardId,
	});
}

export function createCard(
	env: Record<string, unknown>,
	projectId: string,
	params: {
		columnId: string;
		userId: string;
		title: string;
		type: string;
		description?: string;
		acceptanceCriteria?: string;
		assigneeId?: string;
	}
): Promise<CardData> {
	return callDo(env, projectId, "createCard", {
		cardId: crypto.randomUUID(),
		...params,
	});
}

export function updateCard(
	env: Record<string, unknown>,
	projectId: string,
	params: {
		cardId: string;
		userId: string;
		title?: string;
		type?: string;
		description?: string;
		acceptanceCriteria?: string;
		position?: number;
		assigneeId?: string | null;
		agentTriggerUrl?: string | null;
	}
): Promise<CardData> {
	return callDo(env, projectId, "updateCard", params);
}

export function deleteCard(
	env: Record<string, unknown>,
	projectId: string,
	cardId: string,
	userId: string
): Promise<DoMethodReturnTypes["deleteCard"]> {
	return callDo(env, projectId, "deleteCard", { cardId, userId });
}

export function moveCard(
	env: Record<string, unknown>,
	projectId: string,
	params: {
		cardId: string;
		userId: string;
		newColumnId: string;
		newPosition: number;
	}
): Promise<CardData> {
	return callDo(env, projectId, "moveCard", params);
}

export function archiveCard(
	env: Record<string, unknown>,
	projectId: string,
	cardId: string,
	userId: string
): Promise<DoMethodReturnTypes["archiveCards"]> {
	return callDo(env, projectId, "archiveCards", { cardId, userId });
}

export function createComment(
	env: Record<string, unknown>,
	projectId: string,
	params: {
		cardId: string;
		userId: string;
		content: string;
	}
): Promise<DoMethodReturnTypes["createComment"]> {
	return callDo(env, projectId, "createComment", params);
}
