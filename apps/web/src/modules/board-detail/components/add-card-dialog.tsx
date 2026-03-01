import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type z from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { orpc } from "@/utils/orpc";
import type { KanbanCard } from "../types";
import CardForm from "./card-form";
import type { cardFormSchema } from "./constants";

interface AddCardDialogProps {
	boardId: string;
	columnId?: string;
	onCreateCard?: (card: KanbanCard) => void;
	onDialogOpenClose: (open: boolean) => void;
	open: boolean;
	projectId: string;
}

function AddCardDialog({
	boardId,
	projectId,
	columnId,
	open,
	onDialogOpenClose,
	onCreateCard,
}: AddCardDialogProps) {
	const queryClient = useQueryClient();

	const createKanbanCardMutation = useMutation(
		orpc.card.create.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({
					queryKey: orpc.card.getByBoardId.queryKey({ input: { boardId } }),
				});
				onDialogOpenClose(false);
				onCreateCard?.(data);
				toast.success("Card created");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const handleAddCardSubmit = (value: z.infer<typeof cardFormSchema>) => {
		if (!columnId) {
			return;
		}

		createKanbanCardMutation.mutate({
			title: value.title,
			type: value.type,
			description: value.description,
			acceptanceCriteria: value.acceptanceCriteria,
			columnId,
		});
	};

	return (
		<Dialog onOpenChange={onDialogOpenClose} open={open}>
			<DialogContent
				aria-describedby="add-card-description"
				className="max-w-4xl overflow-hidden"
			>
				<div className="flex max-h-[90vh] flex-col overflow-hidden">
					<DialogHeader>
						<DialogTitle>Add KanbanCard</DialogTitle>
						<DialogDescription hidden id="add-card-description">
							Add card form.
						</DialogDescription>
					</DialogHeader>
					<CardForm
						isPending={createKanbanCardMutation.isPending}
						onCancel={() => onDialogOpenClose(false)}
						onSubmit={handleAddCardSubmit}
						projectId={projectId}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default AddCardDialog;
