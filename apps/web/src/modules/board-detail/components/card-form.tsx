import type { OrpcOutput } from "@cloudflare-agent-kanban/api/routers/index";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import type z from "zod";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	type ReactSelectOption,
	ReactSelectWithAvatar,
} from "@/components/ui/react-select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { orpc } from "@/utils/orpc";
import { cardFormSchema, cardTypes } from "./constants";

interface CardFormProps {
	cardId?: string;
	isPending: boolean;
	onCancel: () => void;
	onSubmit: (formValues: z.infer<typeof cardFormSchema>) => void;
	projectId: string;
}

function CardForm({
	projectId,
	cardId,
	isPending,
	onCancel,
	onSubmit,
}: CardFormProps) {
	const { data: card, isLoading } = useQuery(
		orpc.card.getById.queryOptions({
			input: { cardId: cardId ?? "" },
			enabled: !!cardId,
		})
	);

	const { data: projectMembersData, isLoading: isLoadingMembers } = useQuery(
		orpc.project.getMembers.queryOptions({ input: { projectId } })
	);

	const assigneeOptions = useMemo(() => {
		const memberMap = new Map<
			string,
			OrpcOutput["project"]["getMembers"]["members"][0]["user"]
		>();
		if (projectMembersData && !isLoadingMembers) {
			projectMembersData.members.forEach((member) => {
				memberMap.set(member.user.id, member.user);
			});
			if (projectMembersData.owner) {
				memberMap.set(projectMembersData.owner.id, projectMembersData.owner);
			}
		}
		const options: ReactSelectOption[] = [...memberMap].map<ReactSelectOption>(
			([_, member]) => ({
				value: member.id,
				label: member.name ?? "Unknown",
				avatarUrl: member.image,
				name: member.name ?? "",
			})
		);
		return options;
	}, [projectMembersData, isLoadingMembers]);

	const form = useForm({
		defaultValues: {
			title: "",
			type: "user_story" as "epic" | "feature" | "user_story" | "bug" | "task",
			description: "",
			acceptanceCriteria: "",
			assigneeId: null as string | null,
		},
		validators: {
			onSubmit: cardFormSchema,
		},
		onSubmit: async ({ value }) => {
			onSubmit(value);
		},
	});

	useEffect(() => {
		if (card) {
			form.reset(
				{
					title: card.title,
					type: card.type,
					description: card.description ?? "",
					acceptanceCriteria: card.acceptanceCriteria ?? "",
					assigneeId: card.assigneeId ?? null,
				},
				{ keepDefaultValues: false }
			);
		}
	}, [card, form]);

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<form
			className="flex h-full flex-col justify-between"
			id="card-form"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<div className="space-y-4 overflow-y-auto pr-2">
				<form.Field
					children={(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Title</FieldLabel>
								<Input
									aria-invalid={isInvalid}
									autoComplete="off"
									autoFocus
									id={field.name}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="KanbanCard title..."
									value={field.state.value}
								/>
								<FieldDescription>
									Provide a title for your card.
								</FieldDescription>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
					name="title"
				/>
				<form.Field
					children={(field) => {
						return (
							<Field>
								<FieldLabel>Type</FieldLabel>
								<div className="flex flex-wrap gap-2 p-2">
									{cardTypes.map((type) => (
										<button
											className={`rounded-full px-4 py-1.5 font-medium text-sm transition-all ${field.state.value === type.value
													? "ring-2 ring-offset-2 ring-offset-background"
													: "opacity-70 ring-0 hover:opacity-100"
												}`}
											key={`${type.value}${field.state.value}`}
											onClick={() => field.handleChange(type.value)}
											style={
												{
													backgroundColor: type.color,
													color: "white",
													"--tw-ring-color":
														field.state.value === type.value
															? type.color
															: "transparent",
												} as React.CSSProperties
											}
											type="button"
										>
											{type.label}
										</button>
									))}
								</div>
							</Field>
						);
					}}
					name="type"
				/>
				<form.Field
					children={(field) => {
						return (
							<Field>
								<FieldLabel>Description</FieldLabel>
								<RichTextEditor
									onChange={field.handleChange}
									placeholder="As a [role], I want to [action], so that [benefit]..."
									value={field.state.value}
								/>
								<FieldDescription>
									User story format: As a..., I want..., so that...
								</FieldDescription>
							</Field>
						);
					}}
					name="description"
				/>
				<form.Field
					children={(field) => {
						return (
							<Field>
								<FieldLabel>Acceptance Criteria</FieldLabel>
								<RichTextEditor
									onChange={field.handleChange}
									placeholder="Given [context], when [action], then [outcome]..."
									value={field.state.value}
								/>
								<FieldDescription>
									Gherkin format: Given..., when..., then...
								</FieldDescription>
							</Field>
						);
					}}
					name="acceptanceCriteria"
				/>
				{!isLoadingMembers && projectMembersData && (
					<form.Field
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;

							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel>Assignee</FieldLabel>
									<ReactSelectWithAvatar
										aria-invalid={isInvalid}
										onChange={field.handleChange}
										options={assigneeOptions}
										placeholder="Unassigned"
										value={field.state.value}
									/>
								</Field>
							);
						}}
						name="assigneeId"
					/>
				)}
			</div>
			<DialogFooter className="mt-4 flex-shrink-0">
				<Button onClick={onCancel} variant="outline">
					Cancel
				</Button>
				<form.Subscribe
					selector={(state) => state.isDirty}
					children={(isDirty) => (
						<Button disabled={isPending || !isDirty} type="submit">
							{isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Save"
							)}
						</Button>
					)}
				/>
			</DialogFooter>
		</form>
	);
}

export default CardForm;
