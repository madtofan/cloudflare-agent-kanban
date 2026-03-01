import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type z from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orpc } from "@/utils/orpc";
import { useBoardDetailContext } from "../context";
import type { KanbanCard } from "../types";
import CardComments from "./card-comments";
import CardForm from "./card-form";
import CardLinks from "./card-links";
import CardLog from "./card-log";
import type { cardFormSchema } from "./constants";

interface EditCardDialogProps {
	boardId: string;
	canEdit?: boolean;
	card: KanbanCard;
	onDeleteCard?: () => void;
	onDialogOpenClose: (open: boolean) => void;
	onUpdateCard?: (card: KanbanCard) => void;
	open: boolean;
	projectId: string;
}

function EditCardDialog({
	boardId,
	projectId,
	card,
	open,
	onDialogOpenClose,
	onUpdateCard,
	onDeleteCard,
	canEdit = true,
}: EditCardDialogProps) {
	const queryClient = useQueryClient();
	const { isTriggeringCard, triggerCardAgent } = useBoardDetailContext();
	const [forceRerender, setForceRerender] = useState(false);

	const deleteKanbanCardMutation = useMutation(
		orpc.card.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.card.getByBoardId.queryKey({ input: { boardId } }),
				});
				onDeleteCard?.();
				onDialogOpenClose(false);
				toast.success("Card deleted");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const editKanbanCardMutation = useMutation(
		orpc.card.update.mutationOptions({
			onSuccess: (data) => {
				const updatedCard = data.find(Boolean);
				if (!updatedCard) {
					return;
				}
				queryClient.invalidateQueries({
					queryKey: orpc.card.getByBoardId.queryKey({ input: { boardId } }),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.card.getHistory.queryKey({
						input: { cardId: card.id ?? "" },
					}),
				});
				onUpdateCard?.(updatedCard);
				toast.success("Card updated");
				setForceRerender((prev) => !prev);
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const handleSubmitEdit = (value: z.infer<typeof cardFormSchema>) => {
		if (!card.id) {
			return;
		}

		editKanbanCardMutation.mutate({
			cardId: card.id,
			title: value.title,
			type: value.type,
			description: value.description,
			acceptanceCriteria: value.acceptanceCriteria,
		});
	};

	const handleDeleteCard = () => {
		if (
			card.id &&
			confirm(
				"Are you sure you want to delete this card? This action cannot be undone."
			)
		) {
			deleteKanbanCardMutation.mutate({ cardId: card.id });
		}
	};

	const isSubmitting = editKanbanCardMutation.isPending || isTriggeringCard;

	return (
		<Dialog onOpenChange={onDialogOpenClose} open={open}>
			<DialogContent
				aria-describedby="edit-card-description"
				className="max-w-4xl overflow-hidden"
			>
				<div className="flex h-[90vh] flex-col overflow-hidden">
					<DialogHeader>
						<div className="mb-4 flex flex-row justify-between">
							<div>
								<DialogTitle>Edit Card</DialogTitle>
								<DialogDescription id="edit-card-description">
									Edit the card details below.
								</DialogDescription>
							</div>
							<div className="flex flex-col gap-4 pr-6">
								{card?.agentTriggerUrl && canEdit && (
									<Button
										className="w-full border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950"
										disabled={isTriggeringCard}
										onClick={() => card && triggerCardAgent(card)}
										variant="outline"
									>
										<Zap className="mr-2 h-4 w-4" />
										{isTriggeringCard ? "Triggering..." : "Trigger Agent"}
									</Button>
								)}
								{canEdit && (
									<Button onClick={handleDeleteCard} variant="destructive">
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</Button>
								)}
							</div>
						</div>
					</DialogHeader>
					<Tabs
						className="h-full gap-0 overflow-hidden"
						defaultValue="edit"
						key={`tab_${forceRerender}`}
					>
						<TabsList>
							{canEdit && <TabsTrigger value="edit">Edit</TabsTrigger>}
							<TabsTrigger value="links">Links</TabsTrigger>
							<TabsTrigger value="comments">Comments</TabsTrigger>
							<TabsTrigger value="history">History</TabsTrigger>
						</TabsList>
						{canEdit && (
							<TabsContent
								className="h-full gap-0 overflow-hidden border-t pt-4"
								value="edit"
							>
								<CardForm
									cardId={card.id}
									isPending={isSubmitting}
									onCancel={() => onDialogOpenClose(false)}
									onSubmit={handleSubmitEdit}
									projectId={projectId}
								/>
							</TabsContent>
						)}
						<TabsContent
							className="max-h-max flex-1 overflow-auto border-t pt-4"
							value="links"
						>
							<CardLinks boardId={boardId} cardId={card.id!} />
						</TabsContent>
						<TabsContent
							className="max-h-max flex-1 overflow-auto border-t pt-4"
							value="comments"
						>
							<CardComments cardId={card.id} />
						</TabsContent>
						<TabsContent
							className="max-h-max flex-1 overflow-auto border-t pt-4"
							value="history"
						>
							<CardLog cardId={card.id} />
						</TabsContent>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default EditCardDialog;
