import { createFileRoute, notFound } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { ProfilePage } from "@/modules/profile";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/profile/$username")({
	component: ProfileRoute,
	beforeLoad: async ({ params }) => {
		const sessionPromise = authClient.getSession();
		const publicProfilePromise = orpc.profile.getByUsername
			.call({ username: params.username })
			.catch(() => {
				throw notFound();
			});
		const [session, publicProfile] = await Promise.all([
			sessionPromise,
			publicProfilePromise,
		]);
		const currentUser = session.data?.user;
		const isLoggedInUser = currentUser?.id === publicProfile.id;
		const user = currentUser
			? {
					name: currentUser?.name,
					email: currentUser?.email,
				}
			: undefined;
		return { user, isLoggedInUser, publicProfile };
	},
});

function ProfileRoute() {
	const { user, isLoggedInUser, publicProfile } = Route.useRouteContext();

	return (
		<ProfilePage
			isLoggedInUser={isLoggedInUser}
			publicProfile={publicProfile}
			user={user}
		/>
	);
}
