import {
	createFileRoute,
	type LinkProps,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { SidebarIcon } from "lucide-react";
import React from "react";
import AppSidebar from "@/components/app-sidebar";
import Header from "@/components/header";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbProvider,
	BreadcrumbSeparator,
	useBreadcrumb,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	SidebarInset,
	SidebarProvider,
	useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

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
	const navigate = useNavigate();
	const { breadcrumbs } = useBreadcrumb();

	const onBreadcrumbClick = (linkOptions?: LinkProps) => {
		if (!linkOptions) {
			return;
		}
		navigate(linkOptions);
	};

	return (
		<>
			<AppSidebar />
			<SidebarInset className="flex h-full flex-col overflow-hidden">
				<Header>
					<Button onClick={toggleSidebar} size="icon" variant="ghost">
						<SidebarIcon />
					</Button>
					{breadcrumbs.length > 0 && (
						<Breadcrumb>
							<BreadcrumbList className="space-x-6">
								{breadcrumbs.map((item, index) => (
									<div key={item.href?.to ?? item.label} className={cn("flex flex-row space-x-2 align-bottom",
										index === breadcrumbs.length - 1 && "pb-2 border-b",
										index < breadcrumbs.length - 1 && "hidden md:block"
									)}>
										<span className="content-center">
											{(index + 1).toString().padStart(2, "0")}.
										</span>
										<BreadcrumbItem>
											{index === breadcrumbs.length - 1 ? (
												<BreadcrumbPage >{item.label.toUpperCase()}</BreadcrumbPage>
											) : (
												<BreadcrumbLink
													className="cursor-pointer"
													onClick={() => onBreadcrumbClick(item.href)}
												>
													<span>
														{item.label.toUpperCase()}
													</span>
												</BreadcrumbLink>
											)}
										</BreadcrumbItem>
									</div>
								))}
							</BreadcrumbList>
						</Breadcrumb>
					)}
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
			<BreadcrumbProvider>
				<RouteComponent />
			</BreadcrumbProvider>
		</SidebarProvider>
	);
}
