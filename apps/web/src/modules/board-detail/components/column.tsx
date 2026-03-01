import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Column, KanbanCard } from "../types";
import AddCardDialog from "./add-card-dialog";
import EditColumnDialog from "./edit-column-dialog";
import KanbanCardComponent from "./kanban-card";

interface ColumnComponentProps {
	canEdit?: boolean;
	cards: KanbanCard[];
	column: Column;
	onDeleteColumn: () => void;
	projectId: string;
}

function ColumnComponent({
	column,
	cards,
	projectId,
	onDeleteColumn,
	canEdit = true,
}: ColumnComponentProps) {
	const [openCreateCardDialog, setOpenCreateCardDialog] = useState(false);
	const [isEditColumnOpen, setIsEditColumnOpen] = useState(false);
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: column.id,
		data: { type: "column", column },
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			className={`flex h-full w-72 flex-col rounded-lg border bg-muted/30 ${isDragging ? "opacity-50" : ""}`}
			ref={setNodeRef}
			style={style}
		>
			<div
				{...attributes}
				{...listeners}
				className="flex items-center justify-between rounded-t-lg border-b bg-muted/50 p-3"
			>
				<h3 className="font-semibold">{column.name}</h3>
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
								<DropdownMenuItem
									className="text-red-500"
									onClick={onDeleteColumn}
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
				<SortableContext
					items={cards.map((c) => c.id!)}
					strategy={verticalListSortingStrategy}
				>
					{cards.map((card) => (
						<KanbanCardComponent canEdit={canEdit} card={card} key={card.id} />
					))}
				</SortableContext>
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
		</div>
	);
}

export default ColumnComponent;
