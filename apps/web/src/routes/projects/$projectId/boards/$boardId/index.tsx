import { createFileRoute } from "@tanstack/react-router";
import { BoardDetailPage } from "@/modules/board-detail";

export const Route = createFileRoute("/projects/$projectId/boards/$boardId/")({
	component: BoardDetailRoute,
});

function BoardDetailRoute() {
	const { boardId, projectId } = Route.useParams();

	return <BoardDetailPage boardId={boardId} projectId={projectId} />;
}
