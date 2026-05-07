import type { LinkProps } from "@tanstack/react-router";
import type { RefObject } from "react";

export interface LinkType extends LinkProps {
	label: string;
	ref?: RefObject<HTMLDivElement | null>;
}
