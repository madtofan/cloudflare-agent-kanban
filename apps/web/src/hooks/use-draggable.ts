import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";

export type DraggableState = "idle" | "dragging";

interface UseDraggableOptions<TData extends Record<string, unknown>> {
	data: TData;
	id: string;
	onDragStart?: () => void;
	onDrop?: () => void;
}

interface UseDraggableReturn<T extends HTMLElement = HTMLElement> {
	dragState: DraggableState;
	isDragging: boolean;
	ref: React.RefObject<T | null>;
}

export function useDraggable<T extends HTMLElement = HTMLButtonElement>({
	id,
	data,
	onDragStart,
	onDrop,
}: UseDraggableOptions<Record<string, unknown>>): UseDraggableReturn<T> {
	const ref = useRef<T | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragState, setDragState] = useState<DraggableState>("idle");

	useEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}

		invariant(el);

		const cleanup = draggable({
			element: el,
			getInitialData: () => ({
				id,
				...data,
			}),
			onDragStart: () => {
				setIsDragging(true);
				setDragState("dragging");
				onDragStart?.();
			},
			onDrop: () => {
				setIsDragging(false);
				setDragState("idle");
				onDrop?.();
			},
		});

		return cleanup;
	}, [id, data, onDragStart, onDrop]);

	return {
		ref,
		isDragging,
		dragState,
	};
}
