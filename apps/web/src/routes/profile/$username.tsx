import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProfilePage } from "@/modules/profile";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/profile/$username")({
	component: ProfileRoute,
	beforeLoad: async ({ params }) => {
		const publicProfile = await orpc.profile.getByUsername
			.call({ username: params.username })
			.catch(() => {
				throw notFound();
			});
		return { publicProfile };
	},
});

function ProfileRoute() {
	const { publicProfile } = Route.useRouteContext();

	return <ProfilePage publicProfile={publicProfile} />;
}
