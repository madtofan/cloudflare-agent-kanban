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

interface AddColumnDialogProps {
	boardId: string;
	onCreateColumn?: (column: Column) => void;
	onDialogOpenClose: (open: boolean) => void;
	open: boolean;
}

function AddColumnDialog({
	boardId,
	open,
	onDialogOpenClose,
	onCreateColumn,
}: AddColumnDialogProps) {
	const queryClient = useQueryClient();

	const createColumnMutation = useMutation(
		orpc.column.create.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({
					queryKey: orpc.column.getByBoardId.queryKey({ input: { boardId } }),
				});
				onCreateColumn?.(data);
				onDialogOpenClose(false);
				toast.success("Column created");
				form.reset();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const form = useForm({
		defaultValues: {
			name: "",
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			createColumnMutation.mutate({
				boardId,
				name: value.name,
			});
		},
	});

	return (
		<Dialog onOpenChange={onDialogOpenClose} open={open}>
			<DialogContent>
				<form
					id="add-column-form"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<DialogHeader>
						<DialogTitle>Add Column</DialogTitle>
						<DialogDescription hidden={true}>
							Add column to the current board.
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
										Provide a name for the new column.
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
						<Button disabled={createColumnMutation.isPending} type="submit">
							{createColumnMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Add"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default AddColumnDialog;
