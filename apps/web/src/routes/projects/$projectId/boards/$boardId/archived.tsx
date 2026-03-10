import { BoardArchivesPage } from '@/modules/board-archives';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/projects/$projectId/boards/$boardId/archived',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { boardId, projectId } = Route.useParams();

  return <BoardArchivesPage boardId={boardId} projectId={projectId} />;
}
