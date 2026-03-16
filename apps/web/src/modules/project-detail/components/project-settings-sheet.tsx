import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
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
import { FieldDescription, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { orpc } from "@/utils/orpc";

interface ProjectSettingsSheetProps {
	initialData?: {
		name: string;
		visibility: "private" | "public";
		ownerId: string;
		userRole?: string | null;
	};
	onDeleteSuccess?: () => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	projectId: string;
}

function ProjectSettingsSheet({
	projectId,
	open,
	onOpenChange,
	initialData,
	onDeleteSuccess,
}: ProjectSettingsSheetProps) {
	const queryClient = useQueryClient();
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const canManage =
		initialData?.userRole === "owner" || initialData?.userRole === "admin";

	const updateProjectMutation = useMutation(
		orpc.project.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.project.getById.queryKey({ input: { projectId } }),
				});
				toast.success("Project updated");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const deleteProjectMutation = useMutation(
		orpc.project.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.project.getAll.queryKey(),
				});
				toast.success("Project deleted");
				onDeleteSuccess?.();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const handleVisibilityChange = (visibility: "private" | "public") => {
		updateProjectMutation.mutate({ projectId, visibility });
	};

	const handleDelete = () => {
		setShowDeleteConfirm(true);
	};

	const confirmDelete = () => {
		setShowDeleteConfirm(false);
		setIsDeleting(true);
		deleteProjectMutation.mutate({ projectId });
	};

	return (
		<>
			<Sheet onOpenChange={onOpenChange} open={open}>
				<SheetContent className="overflow-y-auto" side="right">
					<SheetHeader>
						<SheetTitle>Project Settings</SheetTitle>
						<SheetDescription>
							Manage your project settings and visibility.
						</SheetDescription>
					</SheetHeader>

					<div className="space-y-6 py-4">
						<div className="space-y-2">
							<FieldLabel>Project Name</FieldLabel>
							<p className="font-medium text-sm">{initialData?.name}</p>
						</div>

						<div className="space-y-2">
							<FieldLabel>Visibility</FieldLabel>
							<div className="flex gap-2">
								<Button
									disabled={updateProjectMutation.isPending || !canManage}
									onClick={() => handleVisibilityChange("private")}
									size="sm"
									variant={
										initialData?.visibility === "private"
											? "default"
											: "outline"
									}
								>
									Private
								</Button>
								<Button
									disabled={updateProjectMutation.isPending || !canManage}
									onClick={() => handleVisibilityChange("public")}
									size="sm"
									variant={
										initialData?.visibility === "public" ? "default" : "outline"
									}
								>
									Public
								</Button>
							</div>
							<FieldDescription>
								{initialData?.visibility === "public"
									? "Anyone can view this project"
									: "Only members can view this project"}
							</FieldDescription>
						</div>

						<Separator className="my-4" />

						<div>
							<h3 className="mb-2 font-semibold text-destructive text-sm">
								Danger Zone
							</h3>
							<p className="mb-3 text-muted-foreground text-xs">
								Deleting a project is permanent and cannot be undone.
							</p>
							{canManage ? (
								<Button
									className="w-full"
									disabled={deleteProjectMutation.isPending || isDeleting}
									onClick={handleDelete}
									type="button"
									variant="destructive"
								>
									{isDeleting ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Trash2 className="mr-2 h-4 w-4" />
									)}
									Delete Project
								</Button>
							) : (
								<p className="text-muted-foreground text-sm">
									Only the owner and admins can delete this project.
								</p>
							)}
						</div>
					</div>
				</SheetContent>
			</Sheet>

			<Dialog onOpenChange={setShowDeleteConfirm} open={showDeleteConfirm}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Project</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this project? This action cannot
							be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							onClick={() => setShowDeleteConfirm(false)}
							variant="outline"
						>
							Cancel
						</Button>
						<Button onClick={confirmDelete} variant="destructive">
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export default ProjectSettingsSheet;
