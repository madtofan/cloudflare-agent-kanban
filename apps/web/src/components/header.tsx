import { mergeClassNames } from "@base-ui/react";
import type { ReactNode } from "react";

interface HeaderProps {
	children: ReactNode;
	className?: string;
}

export default function Header({ children, className }: HeaderProps) {
	return (
		<header
			className={mergeClassNames(
				"sticky top-0 z-1 flex h-16 shrink-0 items-center gap-2 border-b bg-card/90 px-4 backdrop-blur-sm",
				className
			)}
		>
			{children}
		</header>
	);
}
