import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { LandingPage } from "@/modules/landing";

export const Route = createFileRoute("/")({
	component: HomeComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		return { session };
	},
});

function HomeComponent() {
	const { session } = Route.useRouteContext();

	return <LandingPage user={session?.data?.user} />;
}
