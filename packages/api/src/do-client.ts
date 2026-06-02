export function getProjectDo(env: Record<string, unknown>, projectId: string) {
	const ns = env.PROJECT_DO as DurableObjectNamespace;
	const id = ns.idFromName(projectId);
	return ns.get(id);
}

export type UserInfo = {
	id: string;
	name: string;
	image: string | null;
	email: string;
} | null;

export interface BoardData {
	createdAt: Date;
	description: string | null;
	id: string;
	name: string;
	ownerId: string;
	updatedAt: Date;
	visibility: "private" | "public";
}

export interface ColumnData {
	boardId: string;
	createdAt: Date;
	description: string | null;
	id: string;
	name: string;
	position: number;
	updatedAt: Date;
}

export interface CardData {
	acceptanceCriteria: string | null;
	agentTriggerUrl: string | null;
	archivedDate: Date | null;
	assigneeId: string | null;
	boardId: string;
	cardNumber: number;
	columnId: string;
	createdAt: Date;
	description: string | null;
	id: string;
	position: number;
	title: string;
	type: "epic" | "feature" | "user_story" | "bug" | "task";
	updatedAt: Date;
}

export interface CardCommentData {
	cardId: string;
	content: string;
	createdAt: Date;
	id: string;
	userId: string;
}

export interface CardHistoryData {
	action: string;
	cardId: string;
	createdAt: Date;
	fieldName: string | null;
	id: string;
	newValue: string | null;
	oldValue: string | null;
	userId: string | null;
}

export interface CardLabelData {
	cardId: string;
	color: string;
	createdAt: Date;
	id: string;
	name: string;
}

export interface CardLinkData {
	createdAt: Date;
	id: string;
	linkType: string;
	sourceCardId: string;
	targetCardId: string;
}

export interface FolderData {
	createdAt: Date;
	id: string;
	name: string;
	parentFolderId: string | null;
	position: number;
	updatedAt: Date;
}

export interface PageData {
	authorId: string;
	content: string;
	createdAt: Date;
	folderId: string | null;
	id: string;
	position: number;
	title: string;
	updatedAt: Date;
	visibility: "public" | "private";
}

interface CardSummary {
	agentTriggerUrl: string | null;
	assigneeId: string | null;
	cardCommentCount: number;
	cardLinkCount: number;
	cardNumber: number;
	columnId: string;
	id: string;
	position: number;
	title: string;
	type: "epic" | "feature" | "user_story" | "bug" | "task";
}

interface CardSearchResult {
	cardNumber: number;
	id: string;
	title: string;
	type: "epic" | "feature" | "user_story" | "bug" | "task";
}

interface ArchivedCard extends CardData {
	originalColumnName: string;
}

export interface DoMethodReturnTypes {
	archiveByColumn: { success: boolean; archivedCount: number };
	archiveCards: CardData;
	createBoard: BoardData;
	createCard: CardData;
	createColumn: ColumnData;
	createComment: CardCommentData & { user: UserInfo };
	createFolder: FolderData;
	createLink: { success: boolean };
	createPage: PageData;
	deleteBoard: { success: boolean };
	deleteCard: { success: boolean };
	deleteColumn: { success: boolean };
	deleteComment: { success: boolean };
	deleteFolder: { success: boolean };
	deleteLink: { success: boolean };
	deletePage: { success: boolean };
	getArchivedCards: ArchivedCard[];
	getArchivedCount: number;
	getBoard: BoardData;
	getBoards: BoardData[];
	getCard: CardData & { labels: CardLabelData[] };
	getCardsByBoardId: Record<string, CardSummary[]>;
	getCardsByColumnId: CardData[];
	getColumn: ColumnData;
	getColumns: ColumnData[];
	getComments: (CardCommentData & { user: UserInfo })[];
	getFolders: FolderData[];
	getHistory: (CardHistoryData & { userName: string })[];
	getLabels: CardLabelData[];
	getLinks: {
		outgoing: (CardLinkData & { targetCard: CardSearchResult | null })[];
		incoming: (CardLinkData & { sourceCard: CardSearchResult | null })[];
	};
	getPage: PageData & { author: UserInfo };
	getPages: (PageData & { author: UserInfo })[];
	moveCard: CardData;
	reorderColumns: { success: boolean };
	searchCards: CardSearchResult[];
	unarchiveCards: { success: boolean; unarchivedCount: number };
	updateBoard: BoardData;
	updateCard: CardData;
	updateColumn: ColumnData;
	updateFolder: FolderData;
	updatePage: PageData;
}

export async function callDo<T extends keyof DoMethodReturnTypes>(
	env: Record<string, unknown>,
	projectId: string,
	method: T,
	params: Record<string, unknown> = {}
): Promise<DoMethodReturnTypes[T]> {
	if (!projectId) {
		throw new Error("projectId is required");
	}
	const stub = getProjectDo(env, projectId);
	const response = await stub.fetch("http://do", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Project-Id": projectId,
		},
		body: JSON.stringify({ method, params }),
	});
	const data = (await response.json()) as DoMethodReturnTypes[T] & {
		message?: string;
	};
	if (!response.ok) {
		throw new Error(
			(data as { message: string }).message ?? "DO request failed"
		);
	}
	return data;
}

export function getProjectIdFromEntity(entityId: string): string {
	const idx = entityId.indexOf(":");
	if (idx === -1) {
		throw new Error("Invalid entity ID format: missing projectId prefix");
	}
	return entityId.slice(0, idx);
}
