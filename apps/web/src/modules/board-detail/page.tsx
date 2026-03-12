import {
	closestCorners,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Archive, ArrowLeft, Loader2, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
	const [activeKanbanCard, setActiveKanbanCard] = useState<KanbanCard | null>(
		null
	);
	const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

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

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		const type = active.data.current?.type;
		if (type === "card" && active.data.current?.card) {
			setActiveKanbanCard(active.data.current.card as KanbanCard);
		}
	};

	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event;
		if (!over) {
			return;
		}

		const activeType = active.data.current?.type;
		const overType = over.data.current?.type;

		if (activeType !== "card") {
			return;
		}

		const activeKanbanCard = active.data.current?.card as
			| KanbanCard
			| undefined;
		if (!activeKanbanCard) {
			return;
		}

		const overColumnId =
			overType === "column" ? over.id : over.data.current?.card?.columnId;

		if (overColumnId && activeKanbanCard.columnId !== overColumnId) {
			const overColumnKanbanCards =
				cardsByColumn.data?.[overColumnId as string] || [];
			const newPosition =
				overColumnKanbanCards.length > 0
					? Math.max(...overColumnKanbanCards.map((c) => c.position ?? 0)) + 1
					: 0;

			moveKanbanCardMutation.mutate({
				cardId: activeKanbanCard.id ?? "",
				columnId: overColumnId as string,
				position: newPosition,
			});
		}
	};

	const handleDragEnd = (_event: DragEndEvent) => {
		setActiveKanbanCard(null);
	};

	const handleDeleteColumn = (column: Column) => {
		if (
			confirm("Are you sure you want to delete this column and all its cards?")
		) {
			deleteColumnMutation.mutate({ boardId, columnId: column.id });
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
						navigate({ to: "/projects/$projectId", params: { projectId } })
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
			projectId={projectId}
		>
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-between border-b px-6 py-4">
					<div className="flex items-center gap-4">
						<Button
							onClick={() =>
								navigate({ to: "/projects/$projectId", params: { projectId } })
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
									to: "/projects/$projectId/boards/$boardId/archived",
									params: { projectId, boardId },
								})
							}
							variant="outline"
						>
							<Archive className="mr-2 h-4 w-4" />
							Archived
							{archivedCount.data !== undefined && archivedCount.data > 0 && (
								<span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-white text-xs">
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
					<DndContext
						collisionDetection={closestCorners}
						onDragEnd={handleDragEnd}
						onDragOver={handleDragOver}
						onDragStart={handleDragStart}
						sensors={sensors}
					>
						<div className="flex h-full gap-4">
							{columns.data?.map((column) => (
								<ColumnComponent
									boardId={boardId}
									canEdit={isAdminOrOwner}
									cards={cardsByColumn.data?.[column.id] || []}
									column={column}
									key={column.id}
									onDeleteColumn={() => handleDeleteColumn(column)}
									projectId={projectId}
								/>
							))}
						</div>
						<DragOverlay>
							{activeKanbanCard && (
								<div className="cursor-grabbing rounded-md border bg-card p-3 shadow-lg">
									<h4 className="font-medium">{activeKanbanCard.title}</h4>
								</div>
							)}
						</DragOverlay>
					</DndContext>
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
