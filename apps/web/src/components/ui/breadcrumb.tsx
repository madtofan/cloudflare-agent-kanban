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
import { orpc } from "@/utils/orpc";

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

export function generateBoardArchiveParams({
	projectId,
	boardId,
}: {
	projectId: string;
	boardId: string;
}): [BreadcrumbInterface, BreadcrumbTag] {
	return [
		{
			href: {
				to: "/app/projects/$projectId/boards/$boardId/archived",
				params: {
					projectId,
					boardId,
				},
			},
			label: "Archived",
			tag: "board-archive",
		},
		"board-detail",
	];
}

export function generateBoardDetailParams({
	projectId,
	boardId,
	boardData,
}: {
	projectId: string;
	boardId: string;
	boardData?: { name: string };
}): [BreadcrumbInterface, BreadcrumbTag] {
	return [
		{
			href: {
				to: "/app/projects/$projectId/boards/$boardId",
				params: {
					projectId,
					boardId,
				},
			},
			label: boardData?.name ?? "",
			tag: "board-detail",
		},
		"project-detail",
	];
}

export function generateProjectDetailParams({
	projectId,
	projectData,
}: {
	projectId: string;
	projectData?: { name: string };
}): [BreadcrumbInterface, BreadcrumbTag] {
	return [
		{
			href: {
				to: "/app/projects/$projectId",
				params: {
					projectId,
				},
			},
			label: projectData?.name ?? "",
			tag: "project-detail",
		},
		"project-list",
	];
}

export function generateProjectListParams(): [
	BreadcrumbInterface,
	BreadcrumbTag,
] {
	return [
		{
			href: {
				to: "/app/projects",
			},
			label: "Projects",
			tag: "project-list",
		},
		"app",
	];
}

export function generateAppParams(): [BreadcrumbInterface] {
	return [
		{
			href: { to: "/app" },
			label: "Dashboard",
			tag: "app",
		},
	];
}

function generateBreadcrumbs(
	breadcrumb: BreadcrumbInterface,
	parentTag: BreadcrumbTag
): Promise<BreadcrumbInterface>[] {
	if (parentTag === "board-detail") {
		const projectId =
			breadcrumb?.href &&
			"projectId" in (breadcrumb.href.params as Record<string, string>)
				? (breadcrumb.href.params as Record<string, string>).projectId
				: "";
		const boardId =
			breadcrumb?.href &&
			"boardId" in (breadcrumb.href.params as Record<string, string>)
				? (breadcrumb.href.params as Record<string, string>).boardId
				: "";
		if (!(projectId && boardId)) {
			throw new Error("Unable to parse URL Params");
		}

		const [currentBreadcrumb, nextParentTag] = generateBoardDetailParams({
			projectId,
			boardId,
		});
		const boardDetailPromise = new Promise<BreadcrumbInterface>(
			(resolve, reject) => {
				orpc.board.getById
					.call({ boardId })
					.then((boardData) => {
						currentBreadcrumb.label = boardData.name;
						resolve(currentBreadcrumb);
					})
					.catch(() => reject("Failed to obtain Board Data"));
			}
		);
		const otherBreadcrumbs = generateBreadcrumbs(
			currentBreadcrumb,
			nextParentTag
		);
		otherBreadcrumbs.push(boardDetailPromise);
		return otherBreadcrumbs;
	}

	if (parentTag === "project-detail") {
		const projectId =
			breadcrumb?.href &&
			"projectId" in (breadcrumb.href.params as Record<string, string>)
				? (breadcrumb.href.params as Record<string, string>).projectId
				: "";
		if (!projectId) {
			throw new Error("Unable to parse URL Params");
		}

		const [currentBreadcrumb, nextParentTag] = generateProjectDetailParams({
			projectId,
		});
		const projectDetailPromise = new Promise<BreadcrumbInterface>(
			(resolve, reject) => {
				orpc.project.getById
					.call({ projectId })
					.then((projectData) => {
						currentBreadcrumb.label = projectData.name;
						resolve(currentBreadcrumb);
					})
					.catch(() => reject("Failed to obtain Board Data"));
			}
		);
		const otherBreadcrumbs = generateBreadcrumbs(
			currentBreadcrumb,
			nextParentTag
		);
		otherBreadcrumbs.push(projectDetailPromise);
		return otherBreadcrumbs;
	}

	if (parentTag === "project-list") {
		const [currentBreadcrumb, nextParentTag] = generateProjectListParams();
		const projectListPromise = new Promise<BreadcrumbInterface>(
			(resolve, _reject) => {
				resolve(currentBreadcrumb);
			}
		);
		const otherBreadcrumbs = generateBreadcrumbs(
			currentBreadcrumb,
			nextParentTag
		);
		otherBreadcrumbs.push(projectListPromise);
		return otherBreadcrumbs;
	}

	if (parentTag === "app") {
		const [currentBreadcrumb] = generateAppParams();
		const appPromise = new Promise<BreadcrumbInterface>((resolve, _reject) => {
			resolve(currentBreadcrumb);
		});
		return [appPromise];
	}

	return [Promise.resolve(breadcrumb)];
}

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbInterface[]>([]);

	const addBreadcrumb = useCallback(
		async (breadcrumb: BreadcrumbInterface, parentTag?: BreadcrumbTag) => {
			if (!parentTag) {
				setBreadcrumbs([breadcrumb]);
				return;
			}

			const parentCrumbIndex = breadcrumbs.findIndex(
				(crumb) => crumb.tag === parentTag
			);
			if (parentCrumbIndex < 0) {
				const generatedBreadcrumbs = await Promise.all(
					generateBreadcrumbs(breadcrumb, parentTag)
				);
				setBreadcrumbs(generatedBreadcrumbs);
				return;
			}

			setBreadcrumbs((prevBreadcrumbs) => [
				...prevBreadcrumbs.slice(0, parentCrumbIndex + 1),
				breadcrumb,
			]);
		},
		[breadcrumbs]
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
