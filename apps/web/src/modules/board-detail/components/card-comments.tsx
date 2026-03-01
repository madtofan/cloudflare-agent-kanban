import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { orpc } from "@/utils/orpc";
import { useBoardDetailContext } from "../context";
import { formatDate } from "./utils";

interface CardCommentsProps {
	cardId?: string;
}

function CardComments({ cardId }: CardCommentsProps) {
	const queryClient = useQueryClient();
	const { currentUser, boardOwnerId, boardMemberRole } =
		useBoardDetailContext();
	const [commentContent, setCommentContent] = useState("");
	const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

	const { data: comments, isLoading } = useQuery(
		orpc.card.getComments.queryOptions({
			input: { cardId: cardId ?? "" },
			enabled: !!cardId,
		})
	);

	const createCommentMutation = useMutation(
		orpc.card.createComment.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.card.getComments.queryKey({
						input: { cardId: cardId ?? "" },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.card.getCommentCount.queryKey({
						input: {
							cardId: cardId ?? "",
						},
					}),
				});
				setCommentContent("");
				toast.success("Comment added");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const deleteCommentMutation = useMutation(
		orpc.card.deleteComment.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.card.getComments.queryKey({
						input: { cardId: cardId ?? "" },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.card.getCommentCount.queryKey({
						input: {
							cardId: cardId ?? "",
						},
					}),
				});
				toast.success("Comment deleted");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const handleSubmitComment = () => {
		if (!(cardId && commentContent.trim())) {
			return;
		}
		createCommentMutation.mutate({ cardId, content: commentContent });
	};

	const handleDeleteComment = (commentId: string) => {
		setDeleteCommentId(commentId);
	};

	const confirmDeleteComment = () => {
		if (deleteCommentId) {
			deleteCommentMutation.mutate({ cardId: deleteCommentId });
			setDeleteCommentId(null);
		}
	};

	const canDelete = (userId: string | null) => {
		if (!(currentUser && userId)) {
			return false;
		}
		const isAuthor = userId === currentUser.id;
		const isAdminOrOwner =
			boardMemberRole === "admin" || boardOwnerId === currentUser.id;
		return isAuthor || isAdminOrOwner;
	};

	return (
		<div className="flex h-full flex-1 flex-col overflow-hidden">
			<div className="flex flex-1 flex-col overflow-auto">
				{isLoading && (
					<div className="flex h-full items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}
				{!isLoading && comments && comments.length > 0 && (
					<div className="mb-4 space-y-4">
						{comments.map((comment) => (
							<div className="rounded-lg border p-4" key={comment.id}>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{comment.user?.image ? (
											<img
												alt={comment.user.name ?? "User"}
												className="h-8 w-8 rounded-full"
												height={32}
												src={comment.user.image}
												width={32}
											/>
										) : (
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
												<MessageSquare className="h-4 w-4" />
											</div>
										)}
										<div>
											<div className="font-medium">
												{comment.user?.name ?? "Unknown"}
											</div>
											<div className="text-muted-foreground text-xs">
												{formatDate(comment.createdAt)}
											</div>
										</div>
									</div>
									{canDelete(comment.userId) && (
										<Button
											className="h-8 w-8 text-muted-foreground hover:text-destructive"
											disabled={deleteCommentMutation.isPending}
											onClick={() => handleDeleteComment(comment.id)}
											size="icon"
											variant="ghost"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
								{/* eslint-disable-next-line react/no-dangerously-set-inner-html */}
								<div
									className="rich-text-preview mt-2 text-sm"
									dangerouslySetInnerHTML={{ __html: comment.content }}
								/>
							</div>
						))}
					</div>
				)}
				{!isLoading && (!comments || comments.length === 0) && (
					<div className="flex h-32 items-center justify-center text-muted-foreground">
						No comments yet. Be the first to comment!
					</div>
				)}
			</div>
			<div className="border-t pt-4">
				<RichTextEditor
					onChange={setCommentContent}
					placeholder="Write a comment..."
					value={commentContent}
				/>
				<div className="mt-2 flex justify-end">
					<Button
						disabled={!commentContent.trim() || createCommentMutation.isPending}
						onClick={handleSubmitComment}
					>
						{createCommentMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : null}
						Post Comment
					</Button>
				</div>
			</div>

			<Dialog
				onOpenChange={(open) => !open && setDeleteCommentId(null)}
				open={!!deleteCommentId}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Comment</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this comment?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={() => setDeleteCommentId(null)} variant="outline">
							Cancel
						</Button>
						<Button onClick={confirmDeleteComment} variant="destructive">
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default CardComments;
