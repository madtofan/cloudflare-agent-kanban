import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";
import Archives from "./components/archives";

interface ArchivedCardsListProps {
	boardId: string;
	projectId: string;
}

function BoardArchivesPage({ boardId, projectId }: ArchivedCardsListProps) {
	const navigate = useNavigate();
	const board = useQuery(
		orpc.board.getById.queryOptions({ input: { boardId } })
	);

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b px-6 py-4">
				<div className="flex items-center gap-4">
					<Button
						onClick={() =>
							navigate({
								to: "/projects/$projectId/boards/$boardId",
								params: { projectId, boardId },
							})
						}
						size="icon"
						variant="ghost"
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="font-bold text-xl">{`Back to ${board.data?.name}`}</h1>
					</div>
				</div>
			</div>
			<Archives boardId={boardId} />
		</div>
	);
}

export default BoardArchivesPage;
