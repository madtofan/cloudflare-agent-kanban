import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { orpc } from "@/utils/orpc";

function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
}

interface CardSearchModalProps {
	boardId: string;
	excludeCardId?: string;
	onClose: () => void;
	onSelect: (cardId: string) => void;
}

export default function CardSearchModal({
	boardId,
	excludeCardId,
	onClose,
	onSelect,
}: CardSearchModalProps) {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query, 300);

	const { data: searchResults, isLoading } = useQuery(
		orpc.card.searchCards.queryOptions({
			input: { boardId, query: debouncedQuery, excludeCardId },
			enabled: debouncedQuery.length > 0,
		})
	);

	return (
		<Dialog onOpenChange={onClose} open>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Link Card</DialogTitle>
					<DialogDescription>
						Search for a card to link. You can search by card number (e.g., "1")
						or by title.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="relative">
						<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							autoFocus
							className="pl-9"
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by card number or title..."
							value={query}
						/>
					</div>

					{isLoading && (
						<p className="text-muted-foreground text-sm">Searching...</p>
					)}

					{!isLoading &&
						query &&
						searchResults &&
						searchResults.length === 0 && (
							<p className="text-muted-foreground text-sm">
								No cards found matching "{query}"
							</p>
						)}

					{!isLoading && searchResults && searchResults.length > 0 && (
						<div className="max-h-60 space-y-2 overflow-auto">
							{searchResults.map((card) => (
								<Button
									className="w-full justify-start text-left"
									key={card.id}
									onClick={() => onSelect(card.id)}
									variant="outline"
								>
									<span className="font-mono text-muted-foreground">
										#{card.cardNumber}
									</span>
									<span className="ml-2 truncate">{card.title}</span>
									<span className="ml-auto text-muted-foreground text-xs">
										{card.type}
									</span>
								</Button>
							))}
						</div>
					)}

					{!query && (
						<p className="text-muted-foreground text-sm">
							Type to search for cards in this board.
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
