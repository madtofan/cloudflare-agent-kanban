import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { useEffect, useState } from "react";

interface DragState {
	closestEdge: Edge | null;
	draggingCardId: string | null;
	overCardId: string | null;
	overColumnId: string | null;
}

interface UseDragMonitorOptions {
	onDragEnd?: (args: {
		cardId: string;
		overColumnId: string | null;
		overCardId: string | null;
		closestEdge: Edge | null;
	}) => void;
	onDragOver?: (args: {
		cardId: string;
		overColumnId: string | null;
		overCardId: string | null;
		closestEdge: Edge | null;
	}) => void;
	onDragStart?: (args: { cardId: string }) => void;
}

interface UseDragMonitorReturn {
	dragState: DragState;
	isDragging: boolean;
}

export function useDragMonitor({
	onDragStart,
	onDragOver,
	onDragEnd,
}: UseDragMonitorOptions = {}): UseDragMonitorReturn {
	const [dragState, setDragState] = useState<DragState>({
		draggingCardId: null,
		overColumnId: null,
		overCardId: null,
		closestEdge: null,
	});

	const isDragging = dragState.draggingCardId !== null;

	useEffect(() => {
		const cleanup = monitorForElements({
			onDragStart: ({ source }) => {
				const cardId = source.data.id as string;
				setDragState((prev) => ({
					...prev,
					draggingCardId: cardId,
				}));
				onDragStart?.({ cardId });
			},
			onDropTargetChange: ({ source, location }) => {
				const cardId = source.data.id as string;
				const currentDropTargets = location.current.dropTargets;

				if (currentDropTargets.length === 0) {
					setDragState((prev) => ({
						...prev,
						overColumnId: null,
						overCardId: null,
						closestEdge: null,
					}));
					return;
				}

				const topDropTarget = currentDropTargets.at(-1);
				if (topDropTarget) {
					const overColumnId = topDropTarget.data.columnId as
						| string
						| undefined;
					const overCardId = topDropTarget.data.cardId as string | undefined;
					const closestEdge = extractClosestEdge(topDropTarget.data);

					setDragState((prev) => ({
						...prev,
						overColumnId: overColumnId ?? null,
						overCardId: overCardId ?? null,
						closestEdge,
					}));

					onDragOver?.({
						cardId,
						overColumnId: overColumnId ?? null,
						overCardId: overCardId ?? null,
						closestEdge,
					});
				}
			},
			onDrop: ({ source, location }) => {
				const cardId = source.data.id as string;
				const currentDropTargets = location.current.dropTargets;

				let overColumnId: string | null = null;
				let overCardId: string | null = null;
				let closestEdge: Edge | null = null;

				if (currentDropTargets.length > 0) {
					const topDropTarget = currentDropTargets.at(-1);
					if (topDropTarget) {
						overColumnId =
							(topDropTarget.data.columnId as string | undefined) ?? null;
						overCardId =
							(topDropTarget.data.cardId as string | undefined) ?? null;
						closestEdge = extractClosestEdge(topDropTarget.data);
					}
				}

				onDragEnd?.({
					cardId,
					overColumnId,
					overCardId,
					closestEdge,
				});

				setDragState({
					draggingCardId: null,
					overColumnId: null,
					overCardId: null,
					closestEdge: null,
				});
			},
		});

		return cleanup;
	}, [onDragStart, onDragOver, onDragEnd]);

	return {
		dragState,
		isDragging,
	};
}
