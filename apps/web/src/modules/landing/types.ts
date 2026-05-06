import type { LinkProps } from "@tanstack/react-router";
import type { RefObject } from "react";

export interface LinkType extends LinkProps {
  ref?: RefObject<HTMLDivElement | null>;
  label: string;
}
