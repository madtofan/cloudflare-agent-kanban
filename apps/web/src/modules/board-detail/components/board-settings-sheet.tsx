import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { orpc } from "@/utils/orpc";

const formSchema = z.object({
	name: z.string().min(1, "Board name is required").max(64),
	description: z.string(),
	visibility: z.enum(["private", "public"]),
});

interface BoardSettingsSheetProps {
	boardId: string;
	initialData?: {
		name: string;
		description: string | null;
		visibility: "private" | "public";
		ownerId: string;
	};
	onDeleteSuccess?: () => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	userId?: string;
}

function BoardSettingsSheet({
	boardId,
	open,
	onOpenChange,
	initialData,
	userId,
	onDeleteSuccess,
}: BoardSettingsSheetProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [isDeleting, setIsDeleting] = useState(false);

	const isOwner = initialData?.ownerId === userId;

	const updateBoardMutation = useMutation(
		orpc.board.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.board.getById.queryKey({ input: { boardId } }),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.board.getAll.queryKey(),
				});
				toast.success("Board updated");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const deleteBoardMutation = useMutation(
		orpc.board.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.board.getAll.queryKey(),
				});
				toast.success("Board deleted");
				onDeleteSuccess?.();
				navigate({ to: "/projects" });
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const form = useForm({
		defaultValues: {
			name: initialData?.name ?? "",
			description: initialData?.description ?? "",
			visibility: initialData?.visibility ?? "private",
		} as {
			name: string;
			description: string;
			visibility: "private" | "public";
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			updateBoardMutation.mutate({
				boardId,
				name: value.name,
				description: value.description || undefined,
				visibility: value.visibility,
			});
		},
	});

	const handleDelete = () => {
		if (
			confirm(
				"Are you sure you want to delete this board? This action cannot be undone."
			)
		) {
			setIsDeleting(true);
			deleteBoardMutation.mutate({ boardId });
		}
	};

	const isPublic = form.getFieldValue("visibility") === "public";

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="overflow-y-auto" side="right">
				<SheetHeader>
					<SheetTitle>Board Settings</SheetTitle>
					<SheetDescription>
						Manage your board settings and visibility.
					</SheetDescription>
				</SheetHeader>

				<form
					className="space-y-6"
					id="board-settings-form"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<form.Field
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Board Name</FieldLabel>
								<Input
									disabled={!isOwner}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									value={field.state.value}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
						name="name"
					/>

					<form.Field
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Description</FieldLabel>
								<Input
									disabled={!isOwner}
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Add a description..."
									value={field.state.value}
								/>
							</Field>
						)}
						name="description"
					/>

					<form.Field
						children={(field) => (
							<Field>
								<FieldLabel>Visibility</FieldLabel>
								<div className="mt-2 flex items-center gap-4">
									<label className="flex cursor-pointer items-center gap-2">
										<input
											checked={field.state.value === "private"}
											className="accent-primary"
											disabled={!isOwner}
											name={field.name}
											onChange={() => field.handleChange("private")}
											type="radio"
											value="private"
										/>
										<span className="text-sm">Private</span>
									</label>
									<label className="flex cursor-pointer items-center gap-2">
										<input
											checked={field.state.value === "public"}
											className="accent-primary"
											disabled={!isOwner}
											name={field.name}
											onChange={() => field.handleChange("public")}
											type="radio"
											value="public"
										/>
										<span className="text-sm">Public</span>
									</label>
								</div>
								<FieldDescription>
									{isPublic
										? "Anyone with the link can view this board."
										: "Only members can view this board."}
								</FieldDescription>
							</Field>
						)}
						name="visibility"
					/>

					{isOwner && (
						<Button
							className="w-full"
							disabled={updateBoardMutation.isPending}
							type="submit"
						>
							{updateBoardMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Save Changes"
							)}
						</Button>
					)}

					<Separator className="my-4" />

					<div>
						<h3 className="mb-2 font-semibold text-destructive text-sm">
							Danger Zone
						</h3>
						<p className="mb-3 text-muted-foreground text-xs">
							Deleting a board is permanent and cannot be undone.
						</p>
						{isOwner ? (
							<Button
								className="w-full"
								disabled={deleteBoardMutation.isPending || isDeleting}
								onClick={handleDelete}
								type="button"
								variant="destructive"
							>
								{isDeleting ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Trash2 className="mr-2 h-4 w-4" />
								)}
								Delete Board
							</Button>
						) : (
							<p className="text-muted-foreground text-sm">
								Only the owner can delete this board.
							</p>
						)}
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}

export default BoardSettingsSheet;
