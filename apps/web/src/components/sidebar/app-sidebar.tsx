import { useLocation, useNavigate } from "@tanstack/react-router";
import { HomeIcon, LayoutDashboard } from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import SidebarProjectList from "./sidebar-project-list";
import SidebarCreateProject from "./sidebar-create-project";
import SidebarUserDropdown from "./sidebar-user-dropdown";

function AppSidebar() {
	const navigate = useNavigate();
	const location = useLocation();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-sidebar-border border-b">
				<SidebarMenuButton onClick={() => navigate({ to: "/" })} tooltip="Home">
					<HomeIcon />
					<span>Bina IT</span>
				</SidebarMenuButton>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={location.pathname === "/app"}
									onClick={() => navigate({ to: "/app" })}
									tooltip="Dashboard"
								>
									<LayoutDashboard />
									<span>Dashboard</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup>
					<SidebarGroupLabel>Projects</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarProjectList />
							<SidebarCreateProject />

						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-sidebar-border border-t">
				<SidebarMenu>
					<SidebarUserDropdown />
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

export default AppSidebar;
