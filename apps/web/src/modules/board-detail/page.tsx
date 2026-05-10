import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Archive, ArrowLeft, Loader2, Plus, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	generateBoardDetailParams,
	useBreadcrumb,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useDragMonitor } from "@/hooks/use-drag-monitor";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";
import AddColumnDialog from "./components/add-column-dialog";
import BoardSettingsSheet from "./components/board-settings-sheet";
import ColumnComponent from "./components/column";
import { BoardDetailProvider } from "./context";
import type { Column, KanbanCard } from "./types";

interface BoardDetailPageProps {
	boardId: string;
	projectId: string;
}

function BoardDetailPage({ boardId, projectId }: BoardDetailPageProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const { addBreadcrumb } = useBreadcrumb();

	const board = useQuery(
		orpc.board.getById.queryOptions({ input: { boardId } })
	);
	const columns = useQuery(
		orpc.column.getByBoardId.queryOptions({ input: { boardId } })
	);
	const cardsByColumn = useQuery(
		orpc.card.getByBoardId.queryOptions({ input: { boardId } })
	);
	const archivedCount = useQuery(
		orpc.card.getArchivedCount.queryOptions({ input: { boardId } })
	);

	useEffect(() => {
		if (!board.data) {
			return;
		}
		addBreadcrumb(
			...generateBoardDetailParams({
				boardId,
				projectId,
				boardData: board.data,
			})
		);
	}, [board.data, addBreadcrumb, boardId, projectId]);

	const userId = session?.user.id;
	const isOwner = board.data?.ownerId === userId;
	const isAdminOrOwner = isOwner;

	const deleteColumnMutation = useMutation(
		orpc.column.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.column.getByBoardId.queryKey({ input: { boardId } }),
				});
				toast.success("Column deleted");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const moveKanbanCardMutation = useMutation(
		orpc.card.move.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.card.getByBoardId.queryKey({ input: { boardId } }),
				});
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const { dragState } = useDragMonitor({
		onDragEnd: ({ cardId, overColumnId, closestEdge }) => {
			if (!overColumnId) {
				return;
			}

			const sourceCard = findCardById(cardsByColumn.data, cardId);
			if (!sourceCard) {
				return;
			}

			const targetColumnCards = cardsByColumn.data?.[overColumnId] || [];
			const newPosition = calculateNewPosition(
				targetColumnCards,
				null,
				closestEdge
			);
			const hasChanged = hasCardChanged(
				sourceCard,
				overColumnId,
				targetColumnCards,
				newPosition
			);

			if (hasChanged) {
				moveKanbanCardMutation.mutate({
					cardId: sourceCard.id ?? "",
					columnId: overColumnId,
					position: newPosition,
				});
			}
		},
	});

	const findCardById = (
		cardsByColumn: Record<string, KanbanCard[]> | undefined,
		cardId: string
	): KanbanCard | undefined => {
		if (!cardsByColumn) {
			return undefined;
		}
		for (const columnCards of Object.values(cardsByColumn)) {
			const card = columnCards.find((c) => c.id === cardId);
			if (card) {
				return card;
			}
		}
		return undefined;
	};

	const calculateNewPosition = (
		targetCards: KanbanCard[],
		cardId: string | null,
		closestEdge: string | null
	): number => {
		if (!cardId) {
			return targetCards.length > 0
				? Math.max(...targetCards.map((c) => c.position ?? 0)) + 1
				: 0;
		}

		const overCardIndex = targetCards.findIndex((c) => c.id === cardId);

		if (overCardIndex >= 0) {
			if (closestEdge === "top") {
				return overCardIndex;
			}
			if (closestEdge === "bottom") {
				return overCardIndex + 1;
			}
		}

		return overCardIndex >= 0 ? overCardIndex : targetCards.length;
	};

	const hasCardChanged = (
		card: KanbanCard,
		targetColumnId: string,
		targetCards: KanbanCard[],
		newPosition: number
	): boolean => {
		const hasColumnChanged = card.columnId !== targetColumnId;
		const hasPositionChanged =
			targetCards.find((c) => c.id === card.id)?.position !== newPosition;
		return hasColumnChanged || hasPositionChanged;
	};

	const handleDeleteColumn = (column: Column) => {
		deleteColumnMutation.mutate({ boardId, columnId: column.id });
	};

	const handleMoveCard = (cardId: string, targetColumnId: string) => {
		const sourceCard = findCardById(cardsByColumn.data, cardId);
		if (!sourceCard) {
			return;
		}

		const targetColumnCards = cardsByColumn.data?.[targetColumnId] || [];
		const newPosition = calculateNewPosition(targetColumnCards, null, null);
		const hasChanged = hasCardChanged(
			sourceCard,
			targetColumnId,
			targetColumnCards,
			newPosition
		);

		if (hasChanged) {
			moveKanbanCardMutation.mutate({
				cardId,
				columnId: targetColumnId,
				position: newPosition,
			});
		}
	};

	if (board.isLoading || columns.isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (board.isError) {
		return (
			<div className="flex h-full flex-col items-center justify-center">
				<p className="text-red-500">Error loading board</p>
				<Button
					className="mt-4"
					onClick={() =>
						navigate({ to: "/app/projects/$projectId", params: { projectId } })
					}
				>
					Back to Boards
				</Button>
			</div>
		);
	}

	return (
		<BoardDetailProvider
			boardId={boardId}
			boardMemberRole={isAdminOrOwner ? "admin" : "member"}
			boardOwnerId={board.data?.ownerId ?? null}
			columns={columns.data ?? []}
			moveCard={handleMoveCard}
			projectId={projectId}
		>
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-between border-b px-6 py-4">
					<div className="flex items-center gap-4">
						<Button
							onClick={() =>
								navigate({
									to: "/app/projects/$projectId",
									params: { projectId },
								})
							}
							size="icon"
							variant="ghost"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div>
							<h1 className="font-bold text-xl">{board.data?.name}</h1>
							{board.data?.description && (
								<p className="text-muted-foreground text-sm">
									{board.data.description}
								</p>
							)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={() =>
								navigate({
									to: "/app/projects/$projectId/boards/$boardId/archived",
									params: { projectId, boardId },
								})
							}
							variant="outline"
						>
							<Archive className="mr-2 h-4 w-4" />
							Archived
							{archivedCount.data !== undefined && archivedCount.data > 0 && (
								<span className="ml-2 bg-red-500 px-2 py-0.5 text-white text-xs">
									{archivedCount.data}
								</span>
							)}
						</Button>
						{isAdminOrOwner && (
							<Button
								onClick={() => setIsAddColumnOpen(true)}
								variant="outline"
							>
								<Plus className="mr-2 h-4 w-4" />
								Add Column
							</Button>
						)}
						{isAdminOrOwner && (
							<Button
								onClick={() => setIsSettingsOpen(true)}
								size="icon"
								variant="ghost"
							>
								<Settings className="h-5 w-5" />
							</Button>
						)}
					</div>
				</div>

				<div className="flex-1 overflow-x-auto p-6">
					<div className="flex h-full gap-4">
						{columns.data?.map((column) => (
							<ColumnComponent
								boardId={boardId}
								canEdit={isAdminOrOwner}
								cards={cardsByColumn.data?.[column.id] || []}
								column={column}
								isOverColumn={dragState.overColumnId === column.id}
								key={column.id}
								onDeleteColumn={() => handleDeleteColumn(column)}
								overCardId={
									dragState.overColumnId === column.id
										? dragState.overCardId
										: null
								}
								projectId={projectId}
							/>
						))}
					</div>
				</div>

				<AddColumnDialog
					boardId={boardId}
					onDialogOpenClose={setIsAddColumnOpen}
					open={isAddColumnOpen}
				/>

				<BoardSettingsSheet
					boardId={boardId}
					initialData={{
						name: board.data?.name ?? "",
						description: board.data?.description ?? null,
						visibility: board.data?.visibility ?? "private",
						ownerId: board.data?.ownerId ?? "",
					}}
					onOpenChange={setIsSettingsOpen}
					open={isSettingsOpen}
					userId={userId}
				/>
			</div>
		</BoardDetailProvider>
	);
}

export default BoardDetailPage;
