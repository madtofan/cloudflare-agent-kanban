import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailPage } from "@/modules/project-detail";

export const Route = createFileRoute("/projects/$projectId/")({
	component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
	const { projectId } = Route.useParams();

	return <ProjectDetailPage projectId={projectId} />;
}
