import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import AppSidebar from "@/components/app-sidebar";
import Header from "@/components/header";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { SidebarIcon } from "lucide-react";

export const Route = createFileRoute("/app")({
	component: RouteComponentWrapper,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data?.session) {
			throw redirect({
				to: "/login",
			});
		}
		if (!session.data.user.username) {
			throw redirect({
				to: "/select-username",
			});
		}
	},
});

function RouteComponent() {
	const { toggleSidebar } = useSidebar();

	return (
		<>
			<AppSidebar />
			<SidebarInset className="flex h-full flex-col overflow-hidden">
				<Header>
					<Button size="icon" onClick={toggleSidebar}>
						<SidebarIcon />
					</Button>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className="hidden md:block">
								<BreadcrumbLink href="#">Build Your Application</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden md:block" />
							<BreadcrumbItem>
								<BreadcrumbPage>Data Fetching</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</Header>
				<main className="min-h-0 flex-1 overflow-auto bg-background/50 bg-grid">
					<Outlet />
				</main>
			</SidebarInset>
		</>
	);
}

function RouteComponentWrapper() {
	return (
		<SidebarProvider className="h-screen overflow-hidden">
			<RouteComponent />
		</SidebarProvider>
	)
}
