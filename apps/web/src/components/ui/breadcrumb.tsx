import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { LinkProps } from "@tanstack/react-router";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { cn } from "@/lib/utils";

function Breadcrumb({ className, ...props }: ComponentProps<"nav">) {
	return (
		<nav
			aria-label="breadcrumb"
			className={cn(className)}
			data-slot="breadcrumb"
			{...props}
		/>
	);
}

function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
	return (
		<ol
			className={cn(
				"wrap-break-word flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs",
				className
			)}
			data-slot="breadcrumb-list"
			{...props}
		/>
	);
}

function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
	return (
		<li
			className={cn("inline-flex items-center gap-1", className)}
			data-slot="breadcrumb-item"
			{...props}
		/>
	);
}

function BreadcrumbLink({
	className,
	render,
	...props
}: useRender.ComponentProps<"a">) {
	return useRender({
		defaultTagName: "a",
		props: mergeProps<"a">(
			{
				className: cn("transition-colors hover:text-foreground", className),
			},
			props
		),
		render,
		state: {
			slot: "breadcrumb-link",
		},
	});
}

function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
	return (
		<span
			aria-current="page"
			aria-disabled="true"
			className={cn("font-normal text-foreground", className)}
			data-slot="breadcrumb-page"
			role="link"
			{...props}
		/>
	);
}

function BreadcrumbSeparator({
	children,
	className,
	...props
}: ComponentProps<"li">) {
	return (
		<li
			aria-hidden="true"
			className={cn("[&>svg]:size-3.5", className)}
			data-slot="breadcrumb-separator"
			role="presentation"
			{...props}
		>
			{children ?? <ChevronRightIcon />}
		</li>
	);
}

function BreadcrumbEllipsis({ className, ...props }: ComponentProps<"span">) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"flex size-5 items-center justify-center [&>svg]:size-4",
				className
			)}
			data-slot="breadcrumb-ellipsis"
			role="presentation"
			{...props}
		>
			<MoreHorizontalIcon />
			<span className="sr-only">More</span>
		</span>
	);
}

export type BreadcrumbTag =
	| "app"
	| "project-list"
	| "project-detail"
	| "board-detail"
	| "board-archive";

export interface BreadcrumbInterface {
	href?: LinkProps;
	label: string;
	tag: BreadcrumbTag;
}

interface BreadcrumbContextType {
	addBreadcrumb: (
		breadcrumb: BreadcrumbInterface,
		parentTag?: BreadcrumbTag
	) => void;
	breadcrumbs: BreadcrumbInterface[];
	setBreadcrumbs: (items: BreadcrumbInterface[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
	breadcrumbs: [],
	setBreadcrumbs: () => {
		// no-op default
	},
	addBreadcrumb: () => {
		// no-op default
	},
});

export function useBreadcrumb() {
	const context = useContext(BreadcrumbContext);
	return context;
}

interface BreadcrumbProviderProps {
	children: ReactNode;
}

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInterface[]>([]);

	const addBreadcrumb = useCallback(
		(breadcrumb: BreadcrumbInterface, parentTag?: BreadcrumbTag) => {
			setBreadcrumbs((prevBreadcrumbs) => {
				const parentCrumbIndex = prevBreadcrumbs.findIndex(
					(crumb) => crumb.tag === parentTag
				);
				if (parentCrumbIndex >= 0) {
					return [
						...prevBreadcrumbs.slice(0, parentCrumbIndex + 1),
						breadcrumb,
					];
				}
				return [breadcrumb];
			});
		},
		[]
	);

	const value = useMemo(
		() => ({
			breadcrumbs,
			setBreadcrumbs,
			addBreadcrumb,
		}),
		[breadcrumbs, addBreadcrumb]
	);

	return (
		<BreadcrumbContext.Provider value={value}>
			{children}
		</BreadcrumbContext.Provider>
	);
}

export {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
	BreadcrumbEllipsis,
};
