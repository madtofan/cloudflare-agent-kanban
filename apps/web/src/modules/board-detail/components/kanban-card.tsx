import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link2, MessageSquare, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";
import { useBoardDetailContext } from "../context";
import type { KanbanCard } from "../types";
import { cardTypes } from "./constants";
import EditCardDialog from "./edit-card-dialog";

function KanbanCardComponent({
	card,
	canEdit = true,
}: {
	card: KanbanCard;
	canEdit?: boolean;
}) {
	const { boardId, projectId } = useBoardDetailContext();
	const [isEditCardOpen, setIsEditCardOpen] = useState(false);

	const { data: commentCount } = useQuery(
		orpc.card.getCommentCount.queryOptions({
			input: { cardId: card.id ?? "" },
			enabled: !!card.id,
		})
	);

	const { data: linkCount } = useQuery(
		orpc.card.getLinkCount.queryOptions({
			input: { cardId: card.id ?? "" },
			enabled: !!card.id,
		})
	);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: card.id ?? "",
		data: { type: "card", card },
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

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
				ref={setNodeRef}
				style={style}
				{...attributes}
				{...listeners}
				className={`mb-2 w-full cursor-grab rounded-md border bg-card p-3 text-left shadow-sm ${isDragging ? "opacity-50" : ""}`}
				onClick={handleOnCardClick}
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
				{card.description && (
					<div
						className="rich-text-preview mt-1 line-clamp-2 text-muted-foreground text-sm"
						dangerouslySetInnerHTML={{ __html: card.description }}
					/>
				)}
				{card.acceptanceCriteria && (
					<div className="rich-text-preview mt-1 line-clamp-2 border-primary border-l-2 pl-2 text-muted-foreground text-xs italic">
						<div
							dangerouslySetInnerHTML={{ __html: card.acceptanceCriteria }}
						/>
					</div>
				)}
				{(commentCount ?? 0) > 0 && (
					<div className="mt-2 flex items-center gap-1 text-muted-foreground text-xs">
						<MessageSquare className="h-3 w-3" />
						<span>{commentCount}</span>
					</div>
				)}
				{(linkCount ?? 0) > 0 && (
					<div className="mt-2 flex items-center gap-1 text-muted-foreground text-xs">
						<Link2 className="h-3 w-3" />
						<span>{linkCount}</span>
					</div>
				)}
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
