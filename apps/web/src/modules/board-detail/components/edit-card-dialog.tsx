import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CardDetailPage } from "@/modules/card-detail";
import type { KanbanCard } from "../types";

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
	return (
		<Dialog onOpenChange={onDialogOpenClose} open={open}>
			<DialogContent
				aria-describedby="edit-card-description"
				className="w-[100dvw] max-w-[100dvw] overflow-hidden p-4 md:p-6 md:min-w-2xl"
			>
				<CardDetailPage
					boardId={boardId}
					canEdit={canEdit}
					card={card}
					onDeleteCard={onDeleteCard}
					onDialogOpenClose={onDialogOpenClose}
					onUpdateCard={onUpdateCard}
					projectId={projectId}
				/>
			</DialogContent>
		</Dialog>
	);
}

export default EditCardDialog;
