import type { QueryClient } from "@tanstack/react-query";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { orpc } from "@/utils/orpc";
import "../index.css";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "Bina IT - Project Management",
			},
			{
				name: "description",
				content:
					"Bina IT is a project management and kanban application for tracking tasks, projects, and team collaboration.",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "robots",
				content: "index, follow",
			},
			{
				property: "og:title",
				content: "Bina IT - Project Management",
			},
			{
				property: "og:description",
				content:
					"Bina IT is a project management and kanban application for tracking tasks, projects, and team collaboration.",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "Bina IT - Project Management",
			},
			{
				name: "twitter:description",
				content:
					"Bina IT is a project management and kanban application for tracking tasks, projects, and team collaboration.",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
			{
				rel: "canonical",
				href: "https://kanban.madtofan.win",
			},
		],
	}),
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<TooltipProvider>
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					disableTransitionOnChange
					storageKey="vite-ui-theme"
				>
					<Outlet />
					<Toaster richColors />
				</ThemeProvider>
			</TooltipProvider>
			<TanStackRouterDevtools position="bottom-right" />
			<ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
		</>
	);
}
