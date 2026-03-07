import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { CardDetailPage } from "@/modules/card-detail";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute(
	"/projects/$projectId/boards/$boardId/$cardId"
)({
	component: CardDetailRoute,
	beforeLoad: async ({ params }) => {
		const card = await orpc.card.getById
			.call({ cardId: params.cardId })
			.catch(() => {
				throw notFound();
			});
		return { card };
	},
});

function CardDetailRoute() {
	const navigate = useNavigate();
	const { boardId, projectId, cardId } = Route.useParams();
	const { card } = Route.useRouteContext();
	const onDialogOpenClose = (setOpen: boolean) => {
		if (!setOpen) {
			navigate({
				to: "/projects/$projectId/boards/$boardId/$cardId",
				params: { projectId, boardId, cardId },
			});
		}
	};

	return (
		<CardDetailPage
			boardId={boardId}
			card={card}
			onDialogOpenClose={onDialogOpenClose}
			projectId={projectId}
		/>
	);
}
