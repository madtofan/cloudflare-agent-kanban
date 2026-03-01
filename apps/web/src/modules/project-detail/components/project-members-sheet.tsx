import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
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

const addMemberSchema = z.object({
	email: z.email("Invalid email address"),
	role: z.enum(["admin", "member"]),
});

interface ProjectMembersSheetProps {
	currentUserId?: string;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	ownerId?: string;
	projectId: string;
}

interface Member {
	id: string;
	role: "admin" | "member";
	user: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
	};
}

function ProjectMembersSheet({
	projectId,
	open,
	onOpenChange,
	currentUserId,
	ownerId,
}: ProjectMembersSheetProps) {
	const queryClient = useQueryClient();

	const { data: members, isLoading } = useQuery(
		orpc.project.getMembers.queryOptions({ input: { projectId } })
	);

	const canManageMembers = currentUserId === ownerId;

	const addMemberMutation = useMutation(
		orpc.project.addMember.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.project.getMembers.queryKey({ input: { projectId } }),
				});
				toast.success("Member added");
				form.reset();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const removeMemberMutation = useMutation(
		orpc.project.removeMember.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.project.getMembers.queryKey({ input: { projectId } }),
				});
				toast.success("Member removed");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const updateRoleMutation = useMutation(
		orpc.project.updateMemberRole.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.project.getMembers.queryKey({ input: { projectId } }),
				});
				toast.success("Role updated");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const form = useForm({
		defaultValues: {
			email: "",
			role: "member" as "admin" | "member",
		},
		validators: {
			onSubmit: addMemberSchema,
		},
		onSubmit: async ({ value }) => {
			addMemberMutation.mutate({
				projectId,
				email: value.email,
				role: value.role,
			});
		},
	});

	const handleRemoveMember = (memberId: string) => {
		if (confirm("Are you sure you want to remove this member?")) {
			removeMemberMutation.mutate({ projectId, memberId });
		}
	};

	const handleRoleChange = (memberId: string, newRole: "admin" | "member") => {
		updateRoleMutation.mutate({ projectId, memberId, role: newRole });
	};

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="overflow-y-auto" side="right">
				<SheetHeader>
					<SheetTitle>Project Members</SheetTitle>
					<SheetDescription>
						Manage who has access to this project.
					</SheetDescription>
				</SheetHeader>

				{canManageMembers && (
					<form
						className="mt-6 space-y-4"
						id="add-member-form"
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<form.Field
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											Add Member by Email
										</FieldLabel>
										<div className="flex gap-2">
											<Input
												className="flex-1"
												id={field.name}
												name={field.name}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="user@example.com"
												type="email"
												value={field.state.value}
											/>
											<Button
												disabled={addMemberMutation.isPending}
												size="sm"
												type="submit"
											>
												{addMemberMutation.isPending ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Plus className="h-4 w-4" />
												)}
											</Button>
										</div>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
							name="email"
						/>

						<form.Field
							children={(field) => (
								<Field>
									<FieldLabel>Role</FieldLabel>
									<select
										className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
										onChange={(e) =>
											field.handleChange(e.target.value as "admin" | "member")
										}
										value={field.state.value}
									>
										<option value="member">Member</option>
										<option value="admin">Admin</option>
									</select>
									<FieldDescription>
										Admins can manage members, members can only edit content.
									</FieldDescription>
								</Field>
							)}
							name="role"
						/>

						<Separator className="my-4" />
					</form>
				)}

				<div className="mt-4">
					<h3 className="mb-3 flex items-center gap-2 font-semibold text-sm">
						<Users className="h-4 w-4" />
						Members ({members?.members.length ?? 0})
					</h3>

					{isLoading ? (
						<div className="flex justify-center py-4">
							<Loader2 className="h-5 w-5 animate-spin" />
						</div>
					) : (
						<div className="space-y-3">
							{members?.members.map((member) => (
								<MemberItem
									canManageMembers={canManageMembers}
									isCurrentUser={member.user.id === currentUserId}
									isOwner={member.user.id === ownerId}
									isUpdatingRole={
										updateRoleMutation.variables?.memberId === member.id
									}
									key={member.id}
									member={member}
									onRemove={() => handleRemoveMember(member.id)}
									onRoleChange={(role) => handleRoleChange(member.id, role)}
								/>
							))}

							{members?.members.length === 0 && (
								<p className="py-4 text-center text-muted-foreground text-sm">
									No members yet.
								</p>
							)}
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}

interface MemberItemProps {
	canManageMembers: boolean;
	isCurrentUser: boolean;
	isOwner: boolean;
	isUpdatingRole: boolean;
	member: Member;
	onRemove: () => void;
	onRoleChange: (role: "admin" | "member") => void;
}

function MemberItem({
	member,
	isOwner,
	isCurrentUser,
	canManageMembers,
	onRemove,
	onRoleChange,
	isUpdatingRole,
}: MemberItemProps) {
	return (
		<div className="flex items-center justify-between rounded-lg border bg-card p-3">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
					{member.user.image ? (
						<img
							alt={member.user.name ?? ""}
							className="h-10 w-10 rounded-full"
							src={member.user.image}
						/>
					) : (
						<span className="font-medium text-sm">
							{member.user.name?.[0]?.toUpperCase() ?? "?"}
						</span>
					)}
				</div>
				<div>
					<p className="font-medium text-sm">
						{member.user.name ?? "Unknown"}
						{isCurrentUser && (
							<span className="ml-1 text-muted-foreground">(You)</span>
						)}
					</p>
					<p className="text-muted-foreground text-xs">{member.user.email}</p>
				</div>
			</div>

			<div className="flex items-center gap-2">
				{isOwner ? (
					<span className="rounded bg-primary/10 px-2 py-1 text-primary text-xs">
						Owner
					</span>
				) : (
					<>
						{canManageMembers && !isCurrentUser && (
							<>
								<select
									className="rounded border bg-background px-2 py-1 text-xs"
									disabled={isUpdatingRole}
									onChange={(e) =>
										onRoleChange(e.target.value as "admin" | "member")
									}
									value={member.role}
								>
									<option value="member">Member</option>
									<option value="admin">Admin</option>
								</select>
								<Button
									className="h-8 w-8 text-destructive"
									onClick={onRemove}
									size="icon"
									variant="ghost"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</>
						)}
						{!canManageMembers && (
							<span className="rounded bg-muted px-2 py-1 text-xs">
								{member.role}
							</span>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export default ProjectMembersSheet;
