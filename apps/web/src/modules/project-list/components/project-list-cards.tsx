import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FolderKanban, Loader2 } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { orpc } from "@/utils/orpc";

function ProjectListCards() {
	const navigate = useNavigate();
	const { data: projects, isLoading } = useQuery(
		orpc.project.getAll.queryOptions()
	);

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!projects?.length) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 className="font-semibold text-lg">No projects yet</h3>
				<p className="text-muted-foreground">
					Create your first project to get started
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{projects?.map((project) => (
				<Card
					className="cursor-pointer transition-shadow hover:shadow-md"
					key={project.id}
					onClick={() =>
						navigate({
							to: "/app/projects/$projectId",
							params: { projectId: project.id },
						})
					}
				>
					<CardHeader>
						<CardTitle className="truncate">{project.name}</CardTitle>
						{project.description && (
							<CardDescription className="line-clamp-2">
								{project.description}
							</CardDescription>
						)}
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							Created{" "}
							{project.createdAt
								? new Date(project.createdAt).toLocaleDateString()
								: "recently"}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export default ProjectListCards;
