import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import type { ChangeEvent, FormEvent } from "react";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const USERNAME_REGEX = /^[a-z0-9_-]+$/;

export const Route = createFileRoute("/select-username")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data?.session) {
			throw redirect({
				to: "/login",
			});
		}
		if (session.data.user.username) {
			throw redirect({
				to: "/app",
			});
		}
	},
});

function RouteComponent() {
	const navigate = useNavigate({
		from: "/select-username",
	});

	const form = useForm({
		defaultValues: {
			username: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.updateUser(
				{
					username: value.username,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/app",
						});
						toast.success("Username set successfully");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				username: z
					.string()
					.min(6, "Username must be at least 6 characters")
					.max(30, "Username must be at most 30 characters")
					.regex(
						USERNAME_REGEX,
						"Username can only contain lowercase letters, numbers, hyphens, and underscores"
					),
			}),
		},
	});

	const { isPending } = authClient.useSession();

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4">
			<div className="w-full max-w-md space-y-6 text-center">
				<h1 className="font-bold text-3xl">Choose Your Username</h1>
				<p className="text-muted-foreground">
					This will be your unique profile URL. You can change it later in your
					profile settings.
				</p>

				<form
					className="space-y-4 text-left"
					onSubmit={(e: FormEvent) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<div>
						<form.Field name="username">
							{(field) => (
								<div className="space-y-2">
									<label
										className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										htmlFor={field.name}
									>
										Username
									</label>
									<Input
										id={field.name}
										name={field.name}
										onBlur={field.handleBlur}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											field.handleChange(e.target.value.toLowerCase())
										}
										placeholder="e.g. john_doe"
										value={field.state.value}
									/>
									{field.state.meta.errors.map((error) => (
										<p className="text-red-500 text-sm" key={error?.message}>
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<form.Subscribe>
						{(state) => (
							<Button
								className="w-full"
								disabled={!state.canSubmit || state.isSubmitting}
								type="submit"
							>
								{state.isSubmitting ? "Setting username..." : "Continue"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</div>
		</div>
	);
}
