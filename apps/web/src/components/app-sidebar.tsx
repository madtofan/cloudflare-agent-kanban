import { useNavigate } from "@tanstack/react-router";
import {
	BriefcaseBusiness,
	HomeIcon,
	LayoutDashboard,
	SidebarIcon,
	User2,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

function AppSidebar() {
	const { toggleSidebar } = useSidebar();
	const navigate = useNavigate();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenuButton onClick={toggleSidebar}>
					<SidebarIcon />
					<h1>Bina IT</h1>
				</SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup />
				<SidebarMenuItem>
					<SidebarMenuButton onClick={() => navigate({ to: "/" })}>
						<HomeIcon />
						<span>Home</span>
					</SidebarMenuButton>
					<SidebarMenuButton onClick={() => navigate({ to: "/app" })}>
						<LayoutDashboard />
						<span>Dashboard</span>
					</SidebarMenuButton>
					<SidebarMenuButton onClick={() => navigate({ to: "/app/projects" })}>
						<BriefcaseBusiness />
						<span>Projects</span>
					</SidebarMenuButton>
					<SidebarMenuBadge>24</SidebarMenuBadge>
				</SidebarMenuItem>
				<SidebarGroup />
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton>
							<User2 /> Username
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

export default AppSidebar;
