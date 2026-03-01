import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { orpc } from "@/utils/orpc";
import { formatDate, getActionLabel } from "./utils";

interface CardLogProps {
	cardId?: string;
}

function CardLog({ cardId }: CardLogProps) {
	const { data: history, isLoading: isHistoryLoading } = useQuery(
		orpc.card.getHistory.queryOptions({
			input: { cardId: cardId ?? "" },
			enabled: !!cardId,
		})
	);

	return (
		<div className="flex-1 space-y-4 overflow-auto">
			{isHistoryLoading ? (
				<div className="flex h-full items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : history && history.length > 0 ? (
				history.map((entry) => (
					<div className="rounded-lg border p-4" key={entry.id}>
						<div className="flex items-center justify-between">
							<span className="font-medium">
								{getActionLabel(entry.action)}
								{entry.fieldName && ` ${entry.fieldName}`}
							</span>
							<span className="text-muted-foreground text-sm">
								{formatDate(entry.createdAt)}
							</span>
						</div>
						<div className="mt-1 text-muted-foreground text-sm">
							by {entry.userName}
						</div>
						{(entry.oldValue || entry.newValue) && (
							<div className="mt-2 rounded bg-muted p-2 font-mono text-sm">
								{entry.oldValue !== null && (
									<div>
										<span className="text-muted-foreground">Old: </span>
										{entry.oldValue}
									</div>
								)}
								{entry.newValue !== null && (
									<div>
										<span className="text-muted-foreground">New: </span>
										{entry.newValue}
									</div>
								)}
							</div>
						)}
					</div>
				))
			) : (
				<div className="flex h-full items-center justify-center text-muted-foreground">
					No history yet
				</div>
			)}
		</div>
	);
}

export default CardLog;
