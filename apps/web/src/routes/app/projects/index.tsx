import { createFileRoute } from "@tanstack/react-router";
import { ProjectListPage } from "@/modules/project-list";

export const Route = createFileRoute("/app/projects/")({
	component: ProjectListPage,
});
