import type { ReactElement } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

interface ConfirmationAlertDialogProps {
	cancelText?: string;
	confirmText?: string;
	description: string;
	onDialogClose?: () => void;
	onSubmit?: () => void;
	open?: boolean;
	title: string;
	triggerButton?: ReactElement;
}

export default function ConfirmationAlertDialog({
	triggerButton,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	open,
	onDialogClose,
	onSubmit,
}: ConfirmationAlertDialogProps) {
	const handleSubmit = () => {
		onSubmit?.();
		onDialogClose?.();
	};

	return (
		<AlertDialog open={open}>
			{triggerButton && <AlertDialogTrigger render={triggerButton} />}
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => onDialogClose?.()}>
						{cancelText}
					</AlertDialogCancel>
					{onSubmit && <Button onClick={handleSubmit}>{confirmText}</Button>}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
