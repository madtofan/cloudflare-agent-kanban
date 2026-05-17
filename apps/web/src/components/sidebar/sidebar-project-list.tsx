import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
	BriefcaseBusiness,
	ChevronRight,
	FileText,
	LayoutList,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import {
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "../ui/sidebar";

function SidebarProjectList() {
	const navigate = useNavigate();
	const location = useLocation();
	const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
		new Set()
	);

	const { data: projects, isLoading } = useQuery(
		orpc.project.getAll.queryOptions()
	);

	const toggleProject = (projectId: string) => {
		setExpandedProjects((prev) => {
			const next = new Set(prev);
			if (next.has(projectId)) {
				next.delete(projectId);
			} else {
				next.add(projectId);
			}
			return next;
		});
	};

	const handleProjectClick = (projectId: string) => {
		setExpandedProjects(() => {
			const next = new Set<string>();
			next.add(projectId);
			return next;
		});
		navigate({
			to: "/app/projects/$projectId",
			params: { projectId },
		});
	};

	const pathname = location.pathname;
	const search = location.search;
	const isProjectActive = (projectId: string) =>
		pathname.startsWith(`/app/projects/${projectId}`);

	if (isLoading) {
		return (
			<>
				<SidebarMenuItem>
					<SidebarMenuSkeleton showIcon />
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuSkeleton showIcon />
				</SidebarMenuItem>
			</>
		);
	}

	if (!projects?.length) {
		return (
			<SidebarMenuItem>
				<div className="px-2 py-4 text-center text-sidebar-foreground/50 text-xs">
					No projects yet
				</div>
			</SidebarMenuItem>
		);
	}

	return projects.map((project) => {
		const isExpanded = expandedProjects.has(project.id);
		const active = isProjectActive(project.id);

		return (
			<SidebarMenuItem key={project.id}>
				<SidebarMenuButton
					className={cn(
						"py-6",
						active && "border-sidebar-foreground border-l-4 pl-4",
					)}
					isActive={active}
					onClick={() => handleProjectClick(project.id)}
				>
					<BriefcaseBusiness />
					<span>{project.name}</span>
				</SidebarMenuButton>
				<SidebarMenuAction
					className={cn("transition-transform mt-2", isExpanded && "rotate-90")}
					onClick={() => toggleProject(project.id)}
					showOnHover={false}
				>
					<ChevronRight />
				</SidebarMenuAction>
				{isExpanded && (
					<SidebarMenuSub>
						<SidebarMenuSubItem>
							<SidebarMenuSubButton
								isActive={
									pathname === `/app/projects/${project.id}` &&
									search.tab === "boards"
								}
								onClick={() =>
									navigate({
										to: "/app/projects/$projectId",
										params: { projectId: project.id },
										search: { tab: "boards" },
									})
								}
							>
								<LayoutList />
								<span>All Kanban Boards</span>
							</SidebarMenuSubButton>
						</SidebarMenuSubItem>
						<SidebarMenuSubItem>
							<SidebarMenuSubButton
								isActive={
									pathname === `/app/projects/${project.id}` &&
									search.tab === "documentation"
								}
								onClick={() =>
									navigate({
										to: "/app/projects/$projectId",
										params: { projectId: project.id },
										search: { tab: "documentation" },
									})
								}
							>
								<FileText />
								<span>Documentation</span>
							</SidebarMenuSubButton>
						</SidebarMenuSubItem>
					</SidebarMenuSub>
				)}
			</SidebarMenuItem>
		);
	});
}

export default SidebarProjectList;
