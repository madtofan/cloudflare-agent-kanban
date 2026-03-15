import { useMutation } from "@tanstack/react-query";
import { FilePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/utils/orpc";

interface CreatePageDialogProps {
	folderId: string | null;
	onSuccess: () => void;
	open: boolean;
	projectId: string;
	setOpen: (open: boolean) => void;
}

export function CreatePageDialog({
	open,
	setOpen,
	projectId,
	folderId,
	onSuccess,
}: CreatePageDialogProps) {
	const [title, setTitle] = useState("");
	const [visibility, setVisibility] = useState<"public" | "private">("private");

	const createPageMutation = useMutation(
		orpc.documentation.createPage.mutationOptions({
			onSuccess: () => {
				toast.success("Page created");
				setTitle("");
				onSuccess();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) {
			return;
		}
		createPageMutation.mutate({
			projectId,
			title: title.trim(),
			folderId: folderId ?? undefined,
			visibility,
		});
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Page</DialogTitle>
					<DialogDescription>
						Create a new documentation page.
					</DialogDescription>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="page-title">Page Title</Label>
						<Input
							id="page-title"
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter page title..."
							value={title}
						/>
					</div>
					<div className="space-y-2">
						<Label>Visibility</Label>
						<div className="flex gap-2">
							<Button
								onClick={() => setVisibility("private")}
								size="sm"
								type="button"
								variant={visibility === "private" ? "default" : "outline"}
							>
								Private
							</Button>
							<Button
								onClick={() => setVisibility("public")}
								size="sm"
								type="button"
								variant={visibility === "public" ? "default" : "outline"}
							>
								Public
							</Button>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							onClick={() => setOpen(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={createPageMutation.isPending || !title.trim()}
							type="submit"
						>
							{createPageMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							<FilePlus className="mr-2 h-4 w-4" />
							Create
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
