import { useMutation } from "@tanstack/react-query";
import {
	GripVertical,
	Link2,
	MessageSquare,
	MoreVertical,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDraggable } from "@/hooks/use-draggable";
import { cardTypeIconMap, cardTypes } from "@/modules/card-detail";
import { orpc } from "@/utils/orpc";
import { useBoardDetailContext } from "../context";
import type { KanbanCard } from "../types";
import EditCardDialog from "./edit-card-dialog";

interface KanbanCardComponentProps {
	canEdit?: boolean;
	card: KanbanCard;
}

function KanbanCardComponent({
	card,
	canEdit = true,
}: KanbanCardComponentProps) {
	const { boardId, projectId, columns, moveCard } = useBoardDetailContext();
	const [isEditCardOpen, setIsEditCardOpen] = useState(false);

	const { ref, isDragging } = useDraggable<HTMLDivElement>({
		id: card.id ?? "",
		data: { type: "card", cardId: card.id, columnId: card.columnId },
	});

	const triggerAgentMutation = useMutation(
		orpc.card.triggerAgent.mutationOptions({
			onSuccess: () => {
				toast.success("Agent triggered successfully");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const handleTriggerAgent = () => {
		if (card.id) {
			triggerAgentMutation.mutate({ cardId: card.id });
		}
	};

	const handleOnCardClick = () => {
		setIsEditCardOpen(true);
	};

	const handleMoveToColumn = (targetColumnId: string) => {
		moveCard(card.id ?? "", targetColumnId);
	};

	const otherColumns = columns.filter((col) => col.id !== card.columnId);

	const typeLabel = cardTypes.find((t) => t.value === card.type)?.label;
	const typeColor =
		cardTypes.find((t) => t.value === card.type)?.color ?? "#6b7280";
	const TypeIcon = card.type ? cardTypeIconMap[card.type] : undefined;

	return (
		<>
			<ContextMenu>
				<ContextMenuTrigger
					className={`mb-2 w-full border bg-card shadow-sm ${isDragging ? "opacity-50" : ""}`}
					ref={ref}
				>
					<div
						className="flex cursor-grab"
						onClick={handleOnCardClick}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								handleOnCardClick();
							}
						}}
						role="button"
						tabIndex={0}
					>
						<div className="flex grow-1 items-start gap-2 p-3">
							<GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<div className="mb-2 flex items-center justify-between">
									<div className="items-center">
										{card.cardNumber && (
											<span className="text-muted-foreground text-xs mr-2">
												#{card.cardNumber}{" "}
											</span>
										)}
										{card.type && (
											<Tooltip>
												<TooltipTrigger
													render={
														<Badge
															className="h-5 w-5 rounded-full p-0"
															style={{ backgroundColor: typeColor }}
														>
															{TypeIcon && (
																<TypeIcon className="h-3 w-3 text-white" />
															)}
														</Badge>
													}
												/>
												<TooltipContent>{typeLabel}</TooltipContent>
											</Tooltip>
										)}
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger
											render={
												<Button
													className="ml-auto h-6 w-6 p-0"
													onClick={(e) => e.stopPropagation()}
													variant="ghost"
												>
													<MoreVertical className="h-4 w-4" />
												</Button>
											}
										/>
										<DropdownMenuContent align="end">
											{otherColumns.length > 0 && (
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														Move to...
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														{otherColumns.map((column) => (
															<DropdownMenuItem
																key={column.id}
																onClick={(e) => {
																	e.stopPropagation();
																	handleMoveToColumn(column.id);
																}}
															>
																{column.name}
															</DropdownMenuItem>
														))}
													</DropdownMenuSubContent>
												</DropdownMenuSub>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								<h4 className="font-medium">{card.title}</h4>
								<div className="flex gap-4">
									{(card.cardCommentCount ?? 0) > 0 && (
										<div className="mt-2 flex items-center gap-1 text-muted-foreground text-xs">
											<MessageSquare className="h-3 w-3" />
											<span>{card.cardCommentCount}</span>
										</div>
									)}
									{(card.cardLinkCount ?? 0) > 0 && (
										<div className="mt-2 flex items-center gap-1 text-muted-foreground text-xs">
											<Link2 className="h-3 w-3" />
											<span>{card.cardLinkCount}</span>
										</div>
									)}
								</div>
								{card.agentTriggerUrl && canEdit && (
									<>
										<div className="mt-2 flex items-center text-amber-500 text-xs">
											<Zap className="mr-1 h-3 w-3" />
											Agent ready
										</div>
										<Button
											className="w-full border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950"
											disabled={triggerAgentMutation.isPending}
											onClick={handleTriggerAgent}
											variant="outline"
										>
											<Zap className="mr-2 h-4 w-4" />
											{triggerAgentMutation.isPending
												? "Triggering..."
												: "Trigger Agent"}
										</Button>
									</>
								)}
							</div>
						</div>
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					{otherColumns.length > 0 && (
						<ContextMenuSub>
							<ContextMenuSubTrigger>Move to...</ContextMenuSubTrigger>
							<ContextMenuSubContent>
								{otherColumns.map((column) => (
									<ContextMenuItem
										key={column.id}
										onClick={() => handleMoveToColumn(column.id)}
									>
										{column.name}
									</ContextMenuItem>
								))}
							</ContextMenuSubContent>
						</ContextMenuSub>
					)}
				</ContextMenuContent>
			</ContextMenu>
			<EditCardDialog
				boardId={boardId}
				canEdit={canEdit}
				card={card}
				onDialogOpenClose={setIsEditCardOpen}
				open={isEditCardOpen}
				projectId={projectId}
			/>
		</>
	);
}

export default KanbanCardComponent;
