import { createFileRoute } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { ProjectDetailPage } from "@/modules/project-detail";

const projectIdSearchSchema = z.object({
	tab: fallback(z.enum(["boards", "documentation"]), "boards").default(
		"boards"
	),
});

export const Route = createFileRoute("/projects/$projectId/")({
	component: ProjectDetailRoute,
	validateSearch: zodValidator(projectIdSearchSchema),
});

function ProjectDetailRoute() {
	const { projectId } = Route.useParams();
	const { tab } = Route.useSearch();

	return <ProjectDetailPage projectId={projectId} tab={tab} />;
}
