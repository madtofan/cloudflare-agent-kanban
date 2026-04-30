import { useMutation } from "@tanstack/react-query";
import { Link2, MessageSquare, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

function KanbanCardComponent({
	card,
	canEdit = true,
}: KanbanCardComponentProps) {
	const { boardId, projectId } = useBoardDetailContext();
	const [isEditCardOpen, setIsEditCardOpen] = useState(false);

	const { ref, isDragging } = useDraggable<HTMLButtonElement>({
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

	return (
		<>
			<button
				aria-label={`Card: ${card.title}`}
				aria-roledescription="draggable card"
				className={`mb-2 w-full cursor-grab border bg-card p-3 text-left shadow-sm ${isDragging ? "opacity-50" : ""}`}
				data-card-cardnumber={card.cardNumber}
				data-card-column-id={card.columnId}
				data-card-id={card.id}
				data-card-position={card.position}
				data-card-title={card.title}
				data-card-type="card"
				data-card-type-field={card.type}
				onClick={handleOnCardClick}
				ref={ref}
				type="button"
			>
				<div className="mb-2 flex items-center gap-2">
					{card.cardNumber && (
						<span className="text-muted-foreground text-xs">
							#{card.cardNumber}{" "}
						</span>
					)}
					{card.type && (
						<span
							className="rounded-full px-2 py-0.5 font-medium text-white text-xs"
							style={{
								backgroundColor:
									cardTypes.find((t) => t.value === card.type)?.color ??
									"#6b7280",
							}}
						>
							{cardTypes.find((t) => t.value === card.type)?.label}
						</span>
					)}
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
			</button>
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
