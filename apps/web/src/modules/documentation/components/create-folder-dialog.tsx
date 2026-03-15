import { useMutation } from "@tanstack/react-query";
import { FolderPlus, Loader2 } from "lucide-react";
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

interface CreateFolderDialogProps {
	onSuccess: () => void;
	open: boolean;
	parentFolderId: string | null;
	projectId: string;
	setOpen: (open: boolean) => void;
}

export function CreateFolderDialog({
	open,
	setOpen,
	projectId,
	parentFolderId,
	onSuccess,
}: CreateFolderDialogProps) {
	const [name, setName] = useState("");

	const createFolderMutation = useMutation(
		orpc.documentation.createFolder.mutationOptions({
			onSuccess: () => {
				toast.success("Folder created");
				setName("");
				onSuccess();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			return;
		}
		createFolderMutation.mutate({
			projectId,
			name: name.trim(),
			parentFolderId: parentFolderId ?? undefined,
		});
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Folder</DialogTitle>
					<DialogDescription>
						Create a new folder to organize your documentation.
					</DialogDescription>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="folder-name">Folder Name</Label>
						<Input
							id="folder-name"
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter folder name..."
							value={name}
						/>
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
							disabled={createFolderMutation.isPending || !name.trim()}
							type="submit"
						>
							{createFolderMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							<FolderPlus className="mr-2 h-4 w-4" />
							Create
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
