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
import type { KanbanCard } from "./types";

interface BoardDetailContextType {
	boardId: string;
	boardMemberRole: "admin" | "member" | null;
	boardOwnerId: string | null;
	currentUser: { id: string; name: string | null; image: string | null } | null;
	isTriggeringCard: boolean;
	projectId: string;
	triggerCardAgent: (card: KanbanCard) => void;
}

const BoardDetailContext = createContext<BoardDetailContextType>({
	boardId: "",
	projectId: "",
	isTriggeringCard: false,
	triggerCardAgent: () => {},
	currentUser: null,
	boardOwnerId: null,
	boardMemberRole: null,
});

export const useBoardDetailContext = () => {
	try {
		const context = useContext(BoardDetailContext);
		return context;
	} catch {
		console.error(
			"useBoardDetailContext should only be used within its provider"
		);
		return {
			boardId: "",
			projectId: "",
			isTriggeringCard: false,
			triggerCardAgent: () => {},
			currentUser: null,
			boardOwnerId: null,
			boardMemberRole: null,
		};
	}
};

interface BoardDetailProviderProps {
	boardId: string;
	boardMemberRole: "admin" | "member" | null;
	boardOwnerId: string | null;
	children: ReactNode;
	projectId: string;
}

export function BoardDetailProvider({
	boardId,
	projectId,
	boardOwnerId,
	boardMemberRole,
	children,
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

	const currentUser = session?.user
		? {
				id: session.user.id,
				name: session.user.name ?? null,
				image: session.user.image ?? null,
			}
		: null;

	const contextValue = useMemo<BoardDetailContextType>(
		() => ({
			boardId,
			projectId,
			isTriggeringCard: triggerAgentMutation.isPending,
			triggerCardAgent: handleTriggerAgent,
			currentUser,
			boardOwnerId,
			boardMemberRole,
		}),
		[
			boardId,
			projectId,
			triggerAgentMutation.isPending,
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
