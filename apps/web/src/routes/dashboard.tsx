import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { FolderKanban, User } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		const user = session.data?.user;
		if (!(session.data?.session && user)) {
			redirect({
				to: "/login",
				throw: true,
			});
		}
		if (user?.username) {
			redirect({
				to: "/select-username",
				throw: true,
			});
		}
		// biome-ignore lint/style/noNonNullAssertion: User will always exist
		return { user: user! };
	},
});

function RouteComponent() {
	const { user } = Route.useRouteContext();

	const profileUrl = `/profile/${user.username}`;

	return (
		<div className="container mx-auto py-10">
			<h1 className="mb-2 font-bold text-3xl">Dashboard</h1>
			<p className="mb-8 text-muted-foreground">Welcome {user.name}</p>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				<Link
					className="group relative overflow-hidden border p-6 transition-colors hover:bg-accent"
					to="/app/projects"
				>
					<div className="flex items-center gap-4">
						<FolderKanban className="h-10 w-10 text-muted-foreground" />
						<div>
							<h2 className="font-semibold text-xl">Projects</h2>
							<p className="text-muted-foreground text-sm">
								View and manage your projects
							</p>
						</div>
					</div>
				</Link>

				<Link
					className="group relative overflow-hidden border p-6 transition-colors hover:bg-accent"
					to={profileUrl}
				>
					<div className="flex items-center gap-4">
						<User className="h-10 w-10 text-muted-foreground" />
						<div>
							<h2 className="font-semibold text-xl">My Profile</h2>
							<p className="text-muted-foreground text-sm">
								View and edit your profile
							</p>
						</div>
					</div>
				</Link>
			</div>
		</div>
	);
}
