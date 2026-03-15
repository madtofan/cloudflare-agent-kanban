import { FilePlus, FileText, Folder, Globe, Lock } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useDocumentationContext } from "../context";

interface DocumentContentProps {
	onCreatePage: () => void;
	onSelectPage: (pageId: string) => void;
}

function DocumentContent({ onCreatePage, onSelectPage }: DocumentContentProps) {
	const { folders, pages, selectedItem } = useDocumentationContext();

	const selectedFolderData = useMemo(() => {
		if (!(folders && selectedItem?.type === "Page")) {
			return null;
		}
		return folders.find((f) => f.id === selectedItem.id) ?? null;
	}, [folders, selectedItem]);

	const selectedFolderPages = useMemo(() => {
		if (!(pages && selectedItem?.type === "Folder")) {
			return [];
		}
		return pages.filter((p) => p.folderId === selectedItem.id);
	}, [pages, selectedItem]);

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl">
						{selectedFolderData?.name ?? "Folder"}
					</h1>
					<p className="text-muted-foreground">
						{selectedFolderPages.length} page
						{selectedFolderPages.length !== 1 ? "s" : ""} in this folder
					</p>
				</div>
				<Button onClick={() => onCreatePage()}>
					<FilePlus className="mr-2 h-4 w-4" />
					New Page
				</Button>
			</div>

			{selectedFolderPages.length > 0 ? (
				<div className="rounded-md border">
					<table className="w-full">
						<thead>
							<tr className="border-b bg-muted/50 text-left">
								<th className="px-4 py-3 font-medium">Title</th>
								<th className="px-4 py-3 font-medium">Visibility</th>
								<th className="px-4 py-3 font-medium">Author</th>
								<th className="px-4 py-3 font-medium">Updated</th>
							</tr>
						</thead>
						<tbody>
							{selectedFolderPages.map((page) => (
								<tr
									className="cursor-pointer border-b last:border-0 hover:bg-muted"
									key={page.id}
									onClick={() => onSelectPage(page.id)}
								>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<FileText className="h-4 w-4 text-muted-foreground" />
											<span className="font-medium">{page.title}</span>
										</div>
									</td>
									<td className="px-4 py-3">
										{page.visibility === "public" ? (
											<span className="flex items-center gap-1 text-sm">
												<Globe className="h-3 w-3" />
												Public
											</span>
										) : (
											<span className="flex items-center gap-1 text-sm">
												<Lock className="h-3 w-3" />
												Private
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-muted-foreground text-sm">
										{page.author?.name ?? "Unknown"}
									</td>
									<td className="px-4 py-3 text-muted-foreground text-sm">
										{page.updatedAt
											? new Date(page.updatedAt).toLocaleDateString()
											: "recently"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<Folder className="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="mb-2 font-semibold text-lg">
						No pages in this folder
					</h3>
					<p className="mb-4 text-muted-foreground">
						Create your first page in this folder
					</p>
					<Button onClick={() => onCreatePage()}>
						<FilePlus className="mr-2 h-4 w-4" />
						New Page
					</Button>
				</div>
			)}
		</div>
	);
}

export default DocumentContent;
