import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, Info, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/confirmation-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useDroppable } from "@/hooks/use-droppable";
import { orpc } from "@/utils/orpc";
import type { Column, KanbanCard } from "../types";
import AddCardDialog from "./add-card-dialog";
import EditColumnDialog from "./edit-column-dialog";
import KanbanCardComponent from "./kanban-card";

interface ColumnComponentProps {
	boardId: string;
	canEdit?: boolean;
	cards: KanbanCard[];
	column: Column;
	isOverColumn?: boolean;
	onDeleteColumn: () => void;
	overCardId?: string | null;
	projectId: string;
}

function ColumnComponent({
	boardId,
	column,
	cards,
	projectId,
	onDeleteColumn,
	canEdit = true,
	isOverColumn = false,
	overCardId = null,
}: ColumnComponentProps) {
	const queryClient = useQueryClient();
	const [openCreateCardDialog, setOpenCreateCardDialog] = useState(false);
	const [isEditColumnOpen, setIsEditColumnOpen] = useState(false);
	const [openDeleteColumnDialog, setOpenDeleteColumnDialog] = useState(false);
	const [openArchiveAllDialog, setOpenArchiveAllDialog] = useState(false);

	const { ref: columnRef } = useDroppable<HTMLDivElement>({
		id: column.id,
		data: { type: "column", columnId: column.id },
		allowedEdges: ["top", "bottom", "left", "right"],
	});

	const archiveAllCardsMutation = useMutation(
		orpc.card.archiveByColumnId.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({
					queryKey: orpc.card.getByBoardId.queryKey({ input: { boardId } }),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.card.getArchivedByBoardId.queryKey({
						input: { boardId },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.card.getArchivedCount.queryKey({
						input: { boardId },
					}),
				});
				toast.success(`${data.archivedCount} cards archived`);
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const handleArchiveAllCards = () => {
		if (cards.length > 0) {
			archiveAllCardsMutation.mutate({
				columnId: column.id,
			});
		}
	};

	return (
		<div
			className={`flex h-full w-72 flex-col rounded-lg border bg-muted/30 ${isOverColumn ? "border-blue-500" : ""}`}
			ref={columnRef}
		>
			<div className="flex items-center justify-between rounded-t-lg border-b bg-muted/50 p-3">
				<div className="flex items-center gap-2">
					<h3 className="font-semibold">{column.name}</h3>
					{column.description && (
						<Popover>
							<PopoverTrigger
								render={
									<Button className="h-5 w-5 p-0" size="icon" variant="ghost">
										<Info className="h-3.5 w-3.5 text-muted-foreground" />
									</Button>
								}
							/>
							<PopoverContent align="start" className="max-w-64">
								<div className="prose prose-sm dark:prose-invert">
									<MarkdownRenderer content={column.description} />
								</div>
							</PopoverContent>
						</Popover>
					)}
				</div>
				<div className="flex items-center gap-1">
					<span className="mr-2 text-muted-foreground text-sm">
						{cards.length}
					</span>
					{canEdit && (
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button className="h-8 w-8" size="icon" variant="ghost">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								}
							/>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => setIsEditColumnOpen(true)}>
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setOpenArchiveAllDialog(true)}>
									<Archive className="mr-2 h-4 w-4" />
									Archive all cards
								</DropdownMenuItem>
								<DropdownMenuItem
									className="text-red-500"
									onClick={() => setOpenDeleteColumnDialog(true)}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
			<div className="flex-1 overflow-y-auto p-2">
				{cards.map((card) => (
					<KanbanCardComponent canEdit={canEdit} card={card} key={card.id} />
				))}
				{isOverColumn && !cards.some((c) => c.id === overCardId) && (
					<div className="my-2 animate-pulse rounded-md border-2 border-blue-500 border-dashed py-4 text-center text-blue-500 text-sm">
						Move card to this column
					</div>
				)}
			</div>
			<div className="border-t p-2">
				{canEdit && (
					<Button
						className="w-full justify-start"
						onClick={() => setOpenCreateCardDialog(true)}
						variant="ghost"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add KanbanCard
					</Button>
				)}
				<AddCardDialog
					boardId={column.boardId}
					columnId={column.id}
					onDialogOpenClose={setOpenCreateCardDialog}
					open={openCreateCardDialog}
					projectId={projectId}
				/>
				<EditColumnDialog
					column={column}
					onDialogOpenClose={setIsEditColumnOpen}
					open={isEditColumnOpen}
				/>
			</div>

			<ConfirmationDialog
				description="Are you sure you want to delete this column and all its cards?"
				onDialogClose={() => setOpenDeleteColumnDialog(false)}
				onSubmit={onDeleteColumn}
				open={openDeleteColumnDialog}
				title="Delete Column"
			/>
			<ConfirmationDialog
				description={
					cards.length > 0
						? `Are you sure you want to archive all ${cards.length} cards in this column?`
						: "There is no card available in column for archival"
				}
				onDialogClose={() => setOpenArchiveAllDialog(false)}
				onSubmit={cards.length > 0 ? handleArchiveAllCards : undefined}
				open={openArchiveAllDialog}
				title="Archive All Cards"
			/>
		</div>
	);
}

export default ColumnComponent;
