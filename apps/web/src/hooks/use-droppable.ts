import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
	attachClosestEdge,
	type Edge,
	extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";

interface UseDroppableOptions {
	allowedEdges?: Edge[];
	data: Record<string, unknown>;
	id: string;
	onDragEnter?: () => void;
	onDragLeave?: () => void;
	onDrop?: (args: {
		source: { data: Record<string, unknown> };
		closestEdge: Edge | null;
	}) => void;
}

interface UseDroppableReturn<T extends HTMLElement = HTMLElement> {
	closestEdge: Edge | null;
	isDragOver: boolean;
	ref: React.RefObject<T | null>;
}

export function useDroppable<T extends HTMLElement = HTMLDivElement>({
	id,
	data,
	allowedEdges = ["top", "bottom"],
	onDragEnter,
	onDragLeave,
	onDrop,
}: UseDroppableOptions): UseDroppableReturn<T> {
	const ref = useRef<T | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}

		invariant(el);

		const cleanup = dropTargetForElements({
			element: el,
			getData: ({ input, element }) => {
				const baseData = {
					id,
					...data,
				};
				return attachClosestEdge(baseData, {
					input,
					element,
					allowedEdges,
				});
			},
			onDragEnter: () => {
				setIsDragOver(true);
				onDragEnter?.();
			},
			onDragLeave: () => {
				setIsDragOver(false);
				setClosestEdge(null);
				onDragLeave?.();
			},
			onDrop: ({ source, self }) => {
				setIsDragOver(false);
				const edge = extractClosestEdge(self.data);
				setClosestEdge(edge);
				onDrop?.({ source, closestEdge: edge });
			},
		});

		return cleanup;
	}, [id, data, allowedEdges, onDragEnter, onDragLeave, onDrop]);

	return {
		ref,
		isDragOver,
		closestEdge,
	};
}
