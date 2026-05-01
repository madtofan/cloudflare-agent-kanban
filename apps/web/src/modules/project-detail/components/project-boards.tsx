import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LayoutGrid, Loader2 } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { orpc } from "@/utils/orpc";

interface ProjectBoardsProps {
	projectId: string;
}

function ProjectBoards({ projectId }: ProjectBoardsProps) {
	const navigate = useNavigate();
	const boards = useQuery(
		orpc.project.getBoards.queryOptions({ input: { projectId } })
	);

	if (boards.isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (boards.data?.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 className="font-semibold text-lg">No boards in this project</h3>
				<p className="text-muted-foreground">
					Create your first board to get started
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{boards.data?.map((board) => (
				<Card
					className="cursor-pointer transition-shadow hover:shadow-md"
					key={board.id}
					onClick={() =>
						navigate({
							to: "/app/projects/$projectId/boards/$boardId",
							params: { boardId: board.id, projectId },
						})
					}
				>
					<CardHeader>
						<CardTitle className="truncate">{board.name}</CardTitle>
						{board.description && (
							<CardDescription className="line-clamp-2">
								{board.description}
							</CardDescription>
						)}
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							Created{" "}
							{board.createdAt
								? new Date(board.createdAt).toLocaleDateString()
								: "recently"}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export default ProjectBoards;
