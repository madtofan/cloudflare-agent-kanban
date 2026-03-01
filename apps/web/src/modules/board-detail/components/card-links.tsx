import type { CardLinkType } from "@cloudflare-agent-kanban/db/schema/kanban";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReactSelect } from "@/components/ui/react-select";
import { orpc } from "@/utils/orpc";
import CardSearchModal from "./card-search-modal";

const linkTypeLabels: Record<string, string> = {
	parent_of: "Parent of",
	child_of: "Child of",
	blocked_by: "Blocked by",
	blocks: "Blocks",
	depends_on: "Depends on",
	relates_to: "Relates to",
	duplicates: "Duplicates",
	follows: "Follows",
	part_of: "Part of",
	implements: "Implements",
};

interface CardLinksProps {
	boardId: string;
	cardId: string;
}

export default function CardLinks({ cardId, boardId }: CardLinksProps) {
	const queryClient = useQueryClient();
	const [showSearchModal, setShowSearchModal] = useState(false);
	const [selectedLinkType, setSelectedLinkType] =
		useState<string>("relates_to");

	const { data: linksData, isLoading } = useQuery(
		orpc.card.getLinks.queryOptions({ input: { cardId } })
	);

	const createLinkMutation = useMutation(
		orpc.card.createLink.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.card.getLinks.queryKey({ input: { cardId } }),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.card.getByBoardId.queryKey({ input: { boardId } }),
				});
				setShowSearchModal(false);
				toast.success("Link created");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const deleteLinkMutation = useMutation(
		orpc.card.deleteLink.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.card.getLinks.queryKey({ input: { cardId } }),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.card.getByBoardId.queryKey({ input: { boardId } }),
				});
				toast.success("Link removed");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const handleLinkCreated = (targetCardId: string) => {
		createLinkMutation.mutate({
			sourceCardId: cardId,
			targetCardId,
			linkType: selectedLinkType as CardLinkType,
		});
	};

	const handleDeleteLink = (linkId: string) => {
		deleteLinkMutation.mutate({ cardId, linkId });
	};

	if (isLoading) {
		return <div className="text-muted-foreground">Loading links...</div>;
	}

	const outgoing = linksData?.outgoing || [];
	const incoming = linksData?.incoming || [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Link2 className="h-4 w-4" />
					<span className="font-medium">Card Links</span>
				</div>
				<div className="flex items-center gap-2">
					<ReactSelect
						className="w-40"
						onChange={(value) => setSelectedLinkType(value || "relates_to")}
						options={Object.entries(linkTypeLabels).map(([value, label]) => ({
							value,
							label,
							name: label,
						}))}
						value={selectedLinkType}
					/>
					<Button onClick={() => setShowSearchModal(true)} size="sm">
						<Plus className="mr-1 h-4 w-4" />
						Add Link
					</Button>
				</div>
			</div>

			{outgoing.length === 0 && incoming.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					No links yet. Add a link to connect this card to other cards.
				</p>
			) : (
				<div className="space-y-4">
					{outgoing.length > 0 && (
						<div>
							<h4 className="mb-2 font-medium text-muted-foreground text-sm">
								Outgoing Links
							</h4>
							<div className="space-y-2">
								{outgoing.map((link) => (
									<div
										className="flex items-center justify-between rounded-md border p-3"
										key={link.id}
									>
										<div className="flex items-center gap-3">
											<span className="font-medium text-muted-foreground text-sm">
												{linkTypeLabels[link.linkType] || link.linkType}
											</span>
											<span className="text-blue-600">→</span>
											{link.targetCard && (
												<span className="font-mono text-sm">
													#{link.targetCard.cardNumber}
												</span>
											)}
											{link.targetCard && (
												<span className="text-sm">{link.targetCard.title}</span>
											)}
										</div>
										<Button
											className="h-8 w-8 text-muted-foreground hover:text-destructive"
											onClick={() => handleDeleteLink(link.id)}
											size="icon"
											variant="ghost"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					{incoming.length > 0 && (
						<div>
							<h4 className="mb-2 font-medium text-muted-foreground text-sm">
								Incoming Links
							</h4>
							<div className="space-y-2">
								{incoming.map((link) => (
									<div
										className="flex items-center justify-between rounded-md border p-3"
										key={link.id}
									>
										<div className="flex items-center gap-3">
											{link.sourceCard && (
												<span className="font-mono text-sm">
													#{link.sourceCard.cardNumber}
												</span>
											)}
											{link.sourceCard && (
												<span className="text-sm">{link.sourceCard.title}</span>
											)}
											<span className="text-blue-600">→</span>
											<span className="font-medium text-muted-foreground text-sm">
												{linkTypeLabels[link.linkType] || link.linkType}
											</span>
										</div>
										<Button
											className="h-8 w-8 text-muted-foreground hover:text-destructive"
											onClick={() => handleDeleteLink(link.id)}
											size="icon"
											variant="ghost"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{showSearchModal && (
				<CardSearchModal
					boardId={boardId}
					excludeCardId={cardId}
					onClose={() => setShowSearchModal(false)}
					onSelect={handleLinkCreated}
				/>
			)}
		</div>
	);
}
