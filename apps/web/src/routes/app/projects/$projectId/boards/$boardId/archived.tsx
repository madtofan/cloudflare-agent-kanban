import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import {
	generateBoardArchiveParams,
	useBreadcrumb,
} from "@/components/ui/breadcrumb";
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
		addBreadcrumb(...generateBoardArchiveParams({ boardId, projectId }));
	}, [addBreadcrumb, boardId, projectId]);

	return <BoardArchivesPage boardId={boardId} projectId={projectId} />;
}
