import { FilePlus, FileText, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDocumentationContext } from "../context";
import type { PageWithAuthor } from "../types";

interface RootPagesListProps {
	onCreatePage: (folderId: string | null) => void;
	onSelectPage: (pageId: string) => void;
	pages: PageWithAuthor[];
}

function RootPagesList({
	pages,
	onSelectPage,
	onCreatePage,
}: RootPagesListProps) {
	const { selectedItem } = useDocumentationContext();

	return (
		<div>
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="font-medium text-muted-foreground text-xs">
					Root Pages
				</span>
				<Button
					className="h-6 w-6 p-0"
					onClick={(e) => {
						e.stopPropagation();
						onCreatePage(null);
					}}
					size="icon"
					variant="ghost"
				>
					<FilePlus className="h-3 w-3" />
				</Button>
			</div>
			{pages.map((page) => (
				<div
					className={cn(
						"group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted",
						selectedItem?.type === "Page" &&
							selectedItem.id === page.id &&
							"bg-muted"
					)}
					key={page.id}
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
		</div>
	);
}

export default RootPagesList;
