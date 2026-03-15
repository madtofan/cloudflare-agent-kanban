import {
	ChevronRight,
	FilePlus,
	FileText,
	Folder,
	FolderPlus,
	Globe,
	Lock,
	MoreVertical,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDocumentationContext } from "../context";
import type { FolderWithChildren } from "../types";

interface FolderItemProps {
	folder: FolderWithChildren;
	level?: number;
	onCreateFolder: (parentFolderId: string) => void;
	onCreatePage: (folderId: string) => void;
	onSelectFolder: (folderId: string | null) => void;
	onSelectPage: (pageId: string) => void;
}

function FolderTreeItem({
	folder,
	onSelectPage,
	onSelectFolder,
	onCreateFolder,
	onCreatePage,
	level = 0,
}: FolderItemProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const hasChildren = folder.children.length > 0 || folder.pages.length > 0;
	const { selectedItem } = useDocumentationContext();

	return (
		<div>
			<div
				className={cn(
					"flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 hover:bg-muted",
					selectedItem?.type === "Folder" &&
						selectedItem.id === folder.id &&
						"bg-muted"
				)}
				style={{ paddingLeft: `${level * 12 + 8}px` }}
			>
				{hasChildren && (
					<button
						className="p-0.5"
						onClick={(e) => {
							e.stopPropagation();
							setIsExpanded(!isExpanded);
						}}
						type="button"
					>
						<ChevronRight
							className={cn(
								"h-4 w-4 transition-transform",
								isExpanded && "rotate-90"
							)}
						/>
					</button>
				)}
				{!hasChildren && <div className="w-5" />}
				<button
					className="flex flex-1 items-center gap-2 text-left"
					onClick={(e) => {
						e.stopPropagation();
						onSelectFolder(folder.id);
					}}
					type="button"
				>
					<Folder className="h-4 w-4 text-muted-foreground" />
					<span className="truncate text-sm">{folder.name}</span>
				</button>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								className="h-6 w-6 p-0 opacity-0 hover:opacity-100 group-hover:opacity-100"
								size="icon"
								variant="ghost"
							>
								<MoreVertical className="h-3 w-3" />
							</Button>
						}
					/>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								onCreateFolder(folder.id);
							}}
						>
							<FolderPlus className="mr-2 h-4 w-4" />
							New Subfolder
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								onCreatePage(folder.id);
							}}
						>
							<FilePlus className="mr-2 h-4 w-4" />
							New Page
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			{isExpanded && (
				<>
					{folder.pages.map((page) => (
						<div
							className={cn(
								"group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted",
								selectedItem?.type === "Page" &&
									selectedItem.id === page.id &&
									"bg-muted"
							)}
							key={page.id}
							style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
						>
							<button
								className="flex flex-1 items-center gap-2 text-left"
								onClick={(e) => {
									e.stopPropagation();
									onSelectPage(page.id);
								}}
								type="button"
							>
								{page.visibility === "public" ? (
									<Globe className="h-3 w-3 text-muted-foreground" />
								) : (
									<Lock className="h-3 w-3 text-muted-foreground" />
								)}
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span className="truncate text-sm">{page.title}</span>
							</button>
						</div>
					))}
					{folder.children.map((child) => (
						<FolderTreeItem
							folder={child}
							key={child.id}
							level={level + 1}
							onCreateFolder={onCreateFolder}
							onCreatePage={onCreatePage}
							onSelectFolder={onSelectFolder}
							onSelectPage={onSelectPage}
						/>
					))}
				</>
			)}
		</div>
	);
}

export default FolderTreeItem;
