import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/modules/profile";

export const Route = createFileRoute("/profile/$username")({
	component: ProfileRoute,
});

function ProfileRoute() {
	const { username } = Route.useParams();

	return <ProfilePage username={username} />;
}
