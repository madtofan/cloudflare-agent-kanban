import { createFileRoute, Outlet } from "@tanstack/react-router";
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
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/app")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<Header>
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
				<main className="min-h-0 grow overflow-auto bg-background/50 bg-grid">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
