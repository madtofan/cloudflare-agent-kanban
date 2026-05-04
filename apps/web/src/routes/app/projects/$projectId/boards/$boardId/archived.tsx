import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useBreadcrumb } from "@/components/ui/breadcrumb";
import { BoardArchivesPage } from "@/modules/board-archives";

export const Route = createFileRoute(
	"/app/projects/$projectId/boards/$boardId/archived"
)({
	component: RouteComponent,
});

function RouteComponent() {
	const { boardId, projectId } = Route.useParams();
	const { addBreadcrumb } = useBreadcrumb();

	useEffect(() => {
		addBreadcrumb(
			{
				href: {
					to: "/app/projects/$projectId/boards/$boardId/archived",
					params: {
						projectId,
						boardId,
					},
				},
				label: "Archived",
				tag: "board-archive",
			},
			"board-detail"
		);
	}, [addBreadcrumb, boardId, projectId]);

	return <BoardArchivesPage boardId={boardId} projectId={projectId} />;
}
