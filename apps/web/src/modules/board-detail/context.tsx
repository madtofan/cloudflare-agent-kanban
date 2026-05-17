import { useMutation } from "@tanstack/react-query";
import {
	createContext,
	type ReactElement,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
} from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";
import type { Column, KanbanCard } from "./types";

interface BoardDetailContextType {
	boardId: string;
	boardMemberRole: "admin" | "member" | null;
	boardOwnerId: string | null;
	columns: Column[];
	currentUser: { id: string; name: string | null; image: string | null } | null;
	isTriggeringCard: boolean;
	moveCard: (cardId: string, targetColumnId: string) => void;
	projectId: string;
	triggerCardAgent: (card: KanbanCard) => void;
}

const BoardDetailContext = createContext<BoardDetailContextType>({
	boardId: "",
	projectId: "",
	columns: [],
	isTriggeringCard: false,
	moveCard: () => {
		// empty default function
	},
	triggerCardAgent: () => {
		// empty default function
	},
	currentUser: null,
	boardOwnerId: null,
	boardMemberRole: null,
});

export const useBoardDetailContext = () => {
	const context = useContext(BoardDetailContext);
	return context;
};

interface BoardDetailProviderProps {
	boardId: string;
	boardMemberRole: "admin" | "member" | null;
	boardOwnerId: string | null;
	children: ReactNode;
	columns: Column[];
	moveCard: (cardId: string, targetColumnId: string) => void;
	projectId: string;
}

export function BoardDetailProvider({
	boardId,
	projectId,
	boardOwnerId,
	boardMemberRole,
	children,
	columns,
	moveCard,
}: BoardDetailProviderProps): ReactElement {
	const { data: session } = authClient.useSession();
	const triggerAgentMutation = useMutation(
		orpc.card.triggerAgent.mutationOptions({
			onSuccess: () => {
				toast.success("Agent triggered successfully");
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const handleTriggerAgent = useCallback(
		(card: KanbanCard) => {
			if (card.id) {
				triggerAgentMutation.mutate({ cardId: card.id });
			}
		},
		[triggerAgentMutation.mutate]
	);

	const currentUser = useMemo(
		() =>
			session?.user
				? {
						id: session.user.id,
						name: session.user.name ?? null,
						image: session.user.image ?? null,
					}
				: null,
		[session?.user]
	);

	const contextValue = useMemo<BoardDetailContextType>(
		() => ({
			boardId,
			projectId,
			columns,
			isTriggeringCard: triggerAgentMutation.isPending,
			moveCard,
			triggerCardAgent: handleTriggerAgent,
			currentUser,
			boardOwnerId,
			boardMemberRole,
		}),
		[
			boardId,
			projectId,
			columns,
			triggerAgentMutation.isPending,
			moveCard,
			handleTriggerAgent,
			currentUser,
			boardOwnerId,
			boardMemberRole,
		]
	);

	return (
		<BoardDetailContext.Provider value={contextValue}>
			{children}
		</BoardDetailContext.Provider>
	);
}
