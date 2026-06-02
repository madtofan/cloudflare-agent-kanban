import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	GripVertical,
	Link2,
	MessageSquare,
	MoreVertical,
	User,
	Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
import { cardTypes } from "@/modules/card-detail";
import { orpc } from "@/utils/orpc";
import { useBoardDetailContext } from "../context";
import type { KanbanCard } from "../types";
import EditCardDialog from "./edit-card-dialog";

interface KanbanCardComponentProps {
	canEdit?: boolean;
	card: KanbanCard;
}

interface AssignableUser {
	id: string;
	image: string | null;
	name: string | null;
}

interface AssignActions {
	assignableUsers: AssignableUser[];
	assignTo: (userId: string) => void;
	assignToMe: () => void;
	canEdit: boolean;
	card: { assigneeId: string | null };
	currentUser: { id: string; image: string | null; name: string | null } | null;
	unassign: () => void;
}

function AssignableUserItem({
	user,
	onAssign,
}: {
	user: AssignableUser;
	onAssign: (userId: string) => void;
}) {
	return (
		<DropdownMenuItem
			onClick={(e) => {
				e.stopPropagation();
				onAssign(user.id);
			}}
		>
			<Avatar className="mr-2 size-5">
				<AvatarImage src={user.image ?? undefined} />
				<AvatarFallback className="text-[10px]">
					{user.name?.[0]?.toUpperCase() ?? "?"}
				</AvatarFallback>
			</Avatar>
			<span>{user.name ?? "Unknown"}</span>
		</DropdownMenuItem>
	);
}

function AssignableUserContextItem({
	user,
	onAssign,
}: {
	user: AssignableUser;
	onAssign: (userId: string) => void;
}) {
	return (
		<ContextMenuItem onClick={() => onAssign(user.id)}>
			<Avatar className="mr-2 size-5">
				<AvatarImage src={user.image ?? undefined} />
				<AvatarFallback className="text-[10px]">
					{user.name?.[0]?.toUpperCase() ?? "?"}
				</AvatarFallback>
			</Avatar>
			<span>{user.name ?? "Unknown"}</span>
		</ContextMenuItem>
	);
}

function DropdownAssignItems({
	assignToMe,
	unassign,
	assignTo,
	assignableUsers,
	canEdit,
	card: { assigneeId },
	currentUser,
}: AssignActions) {
	return (
		<>
			{canEdit && currentUser && assigneeId !== currentUser.id && (
				<DropdownMenuItem
					onClick={(e) => {
						e.stopPropagation();
						assignToMe();
					}}
				>
					<User className="mr-2 h-4 w-4" />
					Assign to me
				</DropdownMenuItem>
			)}
			{canEdit && assigneeId && (
				<DropdownMenuItem
					onClick={(e) => {
						e.stopPropagation();
						unassign();
					}}
				>
					Unassign
				</DropdownMenuItem>
			)}
			{canEdit && assignableUsers.length > 0 && (
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>Assign to...</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						{assignableUsers.map((user) => (
							<AssignableUserItem
								key={user.id}
								onAssign={assignTo}
								user={user}
							/>
						))}
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			)}
		</>
	);
}

function ContextMenuAssignItems({
	assignToMe,
	unassign,
	assignTo,
	assignableUsers,
	canEdit,
	card: { assigneeId },
	currentUser,
}: AssignActions) {
	return (
		<>
			{canEdit && currentUser && assigneeId !== currentUser.id && (
				<ContextMenuItem onClick={assignToMe}>
					<User className="mr-2 h-4 w-4" />
					Assign to me
				</ContextMenuItem>
			)}
			{canEdit && assigneeId && (
				<ContextMenuItem onClick={unassign}>Unassign</ContextMenuItem>
			)}
			{canEdit && assignableUsers.length > 0 && (
				<ContextMenuSub>
					<ContextMenuSubTrigger>Assign to...</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						{assignableUsers.map((user) => (
							<AssignableUserContextItem
								key={user.id}
								onAssign={assignTo}
								user={user}
							/>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
			)}
		</>
	);
}

function KanbanCardComponent({
	card,
	canEdit = true,
}: KanbanCardComponentProps) {
	const { boardId, projectId, columns, currentUser, moveCard, projectMembers } =
		useBoardDetailContext();
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
		}),
	);

	const handleTriggerAgent = () => {
		if (card.id) {
			triggerAgentMutation.mutate({ cardId: card.id, projectId });
		}
	};

	const handleOnCardClick = () => {
		setIsEditCardOpen(true);
	};

	const handleMoveToColumn = (targetColumnId: string) => {
		moveCard(card.id ?? "", targetColumnId);
	};

	const queryClient = useQueryClient();

	const assignMutation = useMutation(
		orpc.card.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.card.getByBoardId.queryKey({
						input: { boardId, projectId },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.card.getById.queryKey({
						input: { cardId: card.id ?? "", projectId },
					}),
				});
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const handleAssignToMe = () => {
		if (!(card.id && currentUser?.id)) {
			return;
		}
		assignMutation.mutate({
			cardId: card.id,
			projectId,
			assigneeId: currentUser.id,
		});
	};

	const handleUnassign = () => {
		if (!card.id) {
			return;
		}
		assignMutation.mutate({ cardId: card.id, projectId, assigneeId: null });
	};

	const handleAssignTo = (userId: string) => {
		if (!card.id) {
			return;
		}
		assignMutation.mutate({ cardId: card.id, projectId, assigneeId: userId });
	};

	const assignableUsers = useMemo(() => {
		if (!projectMembers) {
			return [];
		}
		const userMap = new Map<string, AssignableUser>();
		if (projectMembers.owner) {
			userMap.set(projectMembers.owner.id, projectMembers.owner);
		}
		for (const member of projectMembers.members) {
			userMap.set(member.user.id, member.user);
		}
		return [...userMap.values()];
	}, [projectMembers]);

	const currentAssignee = useMemo(() => {
		if (!card.assigneeId || assignableUsers.length === 0) {
			return null;
		}
		return assignableUsers.find((u) => u.id === card.assigneeId) ?? null;
	}, [card.assigneeId, assignableUsers]);

	const otherColumns = columns.filter((col) => col.id !== card.columnId);

	const currentCardType = cardTypes.find((t) => t.value === card.type);
	const typeLabel = currentCardType?.label;
	const typeColor = currentCardType?.color ?? "#6b7280";
	const TypeIcon = currentCardType?.icon;

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
						<div className="flex grow items-start gap-2 p-3">
							<GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<div className="mb-2 flex items-center justify-between">
									<div className="items-center flex flex-row gap-2">
										{card.cardNumber && (
											<span className="mr-2 text-muted-foreground text-xs">
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
										{currentAssignee && (
											<Tooltip>
												<TooltipTrigger
													render={
														<Avatar className="ml-1 size-5">
															<AvatarImage
																src={currentAssignee.image ?? undefined}
															/>
															<AvatarFallback className="text-[10px]">
																{currentAssignee.name?.[0]?.toUpperCase() ??
																	"?"}
															</AvatarFallback>
														</Avatar>
													}
												/>
												<TooltipContent>
													Assigned to: {currentAssignee.name ?? "Unknown"}
												</TooltipContent>
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
											{canEdit && otherColumns.length > 0 && (
												<DropdownMenuSeparator />
											)}
											<DropdownAssignItems
												assignableUsers={assignableUsers}
												assignTo={handleAssignTo}
												assignToMe={handleAssignToMe}
												canEdit={canEdit}
												card={card}
												currentUser={currentUser}
												unassign={handleUnassign}
											/>
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
					{canEdit && otherColumns.length > 0 && <ContextMenuSeparator />}
					<ContextMenuAssignItems
						assignableUsers={assignableUsers}
						assignTo={handleAssignTo}
						assignToMe={handleAssignToMe}
						canEdit={canEdit}
						card={card}
						currentUser={currentUser}
						unassign={handleUnassign}
					/>
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
