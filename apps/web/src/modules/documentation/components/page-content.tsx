import { useMutation } from "@tanstack/react-query";
import {
	Globe,
	Loader2,
	Lock,
	MoreVertical,
	Pencil,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { orpc } from "@/utils/orpc";
import { useDocumentationContext } from "../context";

function PageContent() {
	const [editTitle, setEditTitle] = useState("");
	const [editContent, setEditContent] = useState("");
	const [editVisibility, setEditVisibility] = useState<"public" | "private">(
		"private"
	);
	const {
		currentPage,
		selectedItem,
		isEditing,
		isLoadingCurrentPage,
		updateIsEditing,
		updateSelectedItem,
		refetchCurrentPage,
		refetchPages,
	} = useDocumentationContext();

	const updatePageMutation = useMutation(
		orpc.documentation.updatePage.mutationOptions({
			onSuccess: () => {
				toast.success("Page updated");
				updateIsEditing(false);
				refetchCurrentPage();
				refetchPages();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const deletePageMutation = useMutation(
		orpc.documentation.deletePage.mutationOptions({
			onSuccess: () => {
				toast.success("Page deleted");
				updateSelectedItem(null);
				refetchPages();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	useEffect(() => {
		if (currentPage) {
			setEditTitle(currentPage.title);
			setEditContent(currentPage.content);
			setEditVisibility(currentPage.visibility);
		}
	}, [currentPage]);

	const handleSavePage = () => {
		if (selectedItem?.type !== "Page") {
			return;
		}
		updatePageMutation.mutate({
			pageId: selectedItem.id,
			title: editTitle,
			content: editContent,
			visibility: editVisibility,
		});
	};

	const handleDeletePage = () => {
		if (selectedItem?.type !== "Page") {
			return;
		}
		deletePageMutation.mutate({ pageId: selectedItem.id });
	};

	const handleCancelEdit = () => {
		updateIsEditing(false);
		if (currentPage) {
			setEditTitle(currentPage.title);
			setEditContent(currentPage.content);
			setEditVisibility(currentPage.visibility);
		}
	};

	if (isLoadingCurrentPage) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!currentPage) {
		return null;
	}

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6 flex items-center justify-between">
				{isEditing ? (
					<Input
						className="font-bold text-2xl"
						onChange={(e) => setEditTitle(e.target.value)}
						value={editTitle}
					/>
				) : (
					<h1 className="font-bold text-2xl">{currentPage.title}</h1>
				)}
				<div className="flex items-center gap-2">
					{isEditing && (
						<div className="flex gap-1">
							<Button
								onClick={() => setEditVisibility("private")}
								size="sm"
								variant={editVisibility === "private" ? "default" : "outline"}
							>
								<Lock className="mr-1 h-3 w-3" />
								Private
							</Button>
							<Button
								onClick={() => setEditVisibility("public")}
								size="sm"
								variant={editVisibility === "public" ? "default" : "outline"}
							>
								<Globe className="mr-1 h-3 w-3" />
								Public
							</Button>
						</div>
					)}
					{isEditing ? (
						<>
							<Button
								disabled={updatePageMutation.isPending}
								onClick={handleSavePage}
							>
								{updatePageMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Save
							</Button>
							<Button
								disabled={updatePageMutation.isPending}
								onClick={handleCancelEdit}
								variant="ghost"
							>
								Cancel
							</Button>
						</>
					) : (
						<>
							<Button onClick={() => updateIsEditing(true)} variant="outline">
								<Pencil className="mr-2 h-4 w-4" />
								Edit
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button size="icon" variant="ghost">
											<MoreVertical className="h-4 w-4" />
										</Button>
									}
								/>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										className="text-red-600"
										onClick={handleDeletePage}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					)}
				</div>
			</div>

			<div className="mb-4 text-muted-foreground text-sm">
				By {currentPage.author?.name ?? "Unknown"} • Updated{" "}
				{currentPage.updatedAt
					? new Date(currentPage.updatedAt).toLocaleDateString()
					: "recently"}
			</div>

			{isEditing ? (
				<RichTextEditor
					className="min-h-[400px]"
					onChange={setEditContent}
					value={editContent}
				/>
			) : (
				<div className="prose prose-sm dark:prose-invert max-w-none">
					{editContent ? (
						<MarkdownRenderer content={editContent} />
					) : (
						<p className="text-muted-foreground italic">
							No content yet. Click Edit to add content.
						</p>
					)}
				</div>
			)}
		</div>
	);
}

export default PageContent;
