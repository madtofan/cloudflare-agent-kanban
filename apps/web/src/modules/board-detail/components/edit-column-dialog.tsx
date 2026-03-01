import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/utils/orpc";
import type { Column } from "../types";

const formSchema = z.object({
	name: z
		.string()
		.min(1, "Column name must be at least 1 characters.")
		.max(32, "Column name must be at most 32 characters."),
});

interface EditColumnDialogProps {
	column: Column;
	onDialogOpenClose: (open: boolean) => void;
	onEditColumn?: (column: Column) => void;
	open: boolean;
}

function EditColumnDialog({
	column,
	open,
	onDialogOpenClose,
	onEditColumn,
}: EditColumnDialogProps) {
	const queryClient = useQueryClient();

	const updateColumnMutation = useMutation(
		orpc.column.update.mutationOptions({
			onSuccess: (data) => {
				const updatedColumn = data.find(Boolean);
				queryClient.invalidateQueries({
					queryKey: orpc.column.getByBoardId.queryKey({
						input: {
							boardId: column.boardId,
						},
					}),
				});
				if (!updatedColumn) {
					return;
				}
				onDialogOpenClose(false);
				onEditColumn?.(updatedColumn);
				form.reset();
				toast.success("Column updated");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const form = useForm({
		defaultValues: {
			name: column.name,
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			updateColumnMutation.mutate({
				boardId: column.boardId,
				columnId: column.id,
				name: value.name,
			});
		},
	});

	return (
		<Dialog onOpenChange={onDialogOpenClose} open={open}>
			<DialogContent>
				<form
					id="edit-column-form"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<DialogHeader>
						<DialogTitle>Edit Column</DialogTitle>
						<DialogDescription hidden>
							Edit the column details below.
						</DialogDescription>
					</DialogHeader>
					<form.Field
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Column Name</FieldLabel>
									<Input
										aria-invalid={isInvalid}
										autoComplete="off"
										autoFocus
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Column name..."
										value={field.state.value}
									/>
									<FieldDescription>
										Provide an updated name for the column.
									</FieldDescription>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
						name="name"
					/>
					<DialogFooter>
						<Button onClick={() => onDialogOpenClose(false)} variant="outline">
							Cancel
						</Button>
						<Button disabled={updateColumnMutation.isPending} type="submit">
							{updateColumnMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Save"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default EditColumnDialog;
