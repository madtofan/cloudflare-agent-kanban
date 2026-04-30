import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/demo")({
	beforeLoad: () => {
		throw redirect({
			to: "/profile/$username",
			params: {
				username: "demo",
			},
			throw: true,
		});
	},
});
