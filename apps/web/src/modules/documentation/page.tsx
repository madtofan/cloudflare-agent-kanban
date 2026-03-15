// biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: to deselect item
// biome-ignore-all lint/a11y/noStaticElementInteractions: to deselect item
import { FilePlus, FileText, FolderPlus, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateFolderDialog } from "./components/create-folder-dialog";
import { CreatePageDialog } from "./components/create-page-dialog";
import DocumentContent from "./components/document-content";
import FolderTreeItem from "./components/folder-tree-item";
import PageContent from "./components/page-content";
import RootPagesList from "./components/root-pages-list";
import { DocumentationProvider, useDocumentationContext } from "./context";
import type { FolderWithChildren } from "./types";

interface DocumentationPageProps {
	projectId: string;
}

function DocumentationPage({ projectId }: DocumentationPageProps) {
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
	const [createFolderParentId, setCreateFolderParentId] = useState<
		string | null
	>(null);

	const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
	const [createPageFolderId, setCreatePageFolderId] = useState<string | null>(
		null
	);

	const {
		currentPage,
		selectedItem,
		folders,
		pages,
		isLoadingFolders,
		isLoadingPages,
		updateSelectedItem,
		refetchFolder,
		refetchPages,
	} = useDocumentationContext();

	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Folder tree generation
	const foldersWithHierarchy = useMemo(() => {
		if (!(folders && pages)) {
			return [];
		}

		const folderMap = new Map<string, FolderWithChildren>();
		const rootFolders: FolderWithChildren[] = [];

		for (const folder of folders) {
			folderMap.set(folder.id, {
				...folder,
				children: [],
				pages: [],
			});
		}

		for (const folder of folders) {
			const folderWithChildren = folderMap.get(folder.id);
			if (folderWithChildren && folder.parentFolderId) {
				const parent = folderMap.get(folder.parentFolderId);
				if (parent) {
					parent.children.push(folderWithChildren);
				} else {
					rootFolders.push(folderWithChildren);
				}
			} else if (folderWithChildren) {
				rootFolders.push(folderWithChildren);
			}
		}

		for (const page of pages) {
			if (page.folderId) {
				const folder = folderMap.get(page.folderId);
				if (folder) {
					folder.pages.push(page);
				}
			}
		}

		return rootFolders;
	}, [folders, pages]);

	const rootPages = useMemo(() => {
		if (!pages) {
			return [];
		}
		return pages.filter((p) => !p.folderId);
	}, [pages]);

	const handleSelectPage = (pageId: string) => {
		updateSelectedItem({ type: "Page", id: pageId });
	};

	const handleSelectFolder = (folderId: string | null) => {
		updateSelectedItem(folderId ? { type: "Folder", id: folderId } : null);
	};

	const handleCreateFolder = useCallback(() => {
		let parentId: string | null = null;

		if (selectedItem?.type === "Folder") {
			parentId = selectedItem.id;
		}
		if (selectedItem?.type === "Page" && currentPage) {
			parentId = currentPage.folderId;
		}

		setCreateFolderParentId(parentId);
		setIsCreateFolderOpen(true);
	}, [currentPage, selectedItem]);

	const handleCreatePage = useCallback(() => {
		let parentId: string | null = null;

		if (selectedItem?.type === "Folder") {
			parentId = selectedItem.id;
		}
		if (selectedItem?.type === "Page" && currentPage) {
			parentId = currentPage.folderId;
		}

		setCreatePageFolderId(parentId);
		setIsCreatePageOpen(true);
	}, [currentPage, selectedItem]);

	const contentSection = useMemo(() => {
		if (!selectedItem) {
			return (
				<div className="flex h-full flex-col items-center justify-center text-center">
					<FileText className="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="mb-2 font-semibold text-lg">Select a document</h3>
					<p className="text-muted-foreground">
						Choose a document from the sidebar or create a new one
					</p>
				</div>
			);
		}

		if (selectedItem.type === "Page") {
			return <PageContent />;
		}

		if (selectedItem.type === "Folder") {
			return (
				<DocumentContent
					onCreatePage={handleCreatePage}
					onSelectPage={handleCreatePage}
				/>
			);
		}

		return null;
	}, [selectedItem, handleCreatePage]);

	if (isLoadingFolders || isLoadingPages) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<>
			<div className="flex h-full">
				<div
					className="w-64 flex-shrink-0 overflow-auto border-r bg-card p-4"
					onClick={() => {
						updateSelectedItem(null);
					}}
				>
					<div className="mb-4 flex items-center justify-between">
						<h3 className="font-semibold">Documentation</h3>
						<div className="flex gap-1">
							<Button
								className="h-7 w-7 p-0"
								onClick={(e) => {
									e.stopPropagation();
									handleCreateFolder();
								}}
								size="icon"
								variant="ghost"
							>
								<FolderPlus className="h-4 w-4" />
							</Button>
							<Button
								className="h-7 w-7 p-0"
								onClick={(e) => {
									e.stopPropagation();
									handleCreatePage();
								}}
								size="icon"
								variant="ghost"
							>
								<FilePlus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="space-y-1">
						{foldersWithHierarchy.map((folder) => (
							<FolderTreeItem
								folder={folder}
								key={folder.id}
								onCreateFolder={handleCreateFolder}
								onCreatePage={handleCreatePage}
								onSelectFolder={handleSelectFolder}
								onSelectPage={handleSelectPage}
							/>
						))}
						<RootPagesList
							onCreatePage={handleCreatePage}
							onSelectPage={handleSelectPage}
							pages={rootPages}
						/>
					</div>
				</div>

				<div className="flex-1 overflow-auto p-6">{contentSection}</div>
			</div>

			<CreateFolderDialog
				onSuccess={() => {
					refetchFolder();
					setIsCreateFolderOpen(false);
				}}
				open={isCreateFolderOpen}
				parentFolderId={createFolderParentId}
				projectId={projectId}
				setOpen={setIsCreateFolderOpen}
			/>

			<CreatePageDialog
				folderId={createPageFolderId}
				onSuccess={() => {
					refetchPages();
					setIsCreatePageOpen(false);
				}}
				open={isCreatePageOpen}
				projectId={projectId}
				setOpen={setIsCreatePageOpen}
			/>
		</>
	);
}

function ContextWrapper({ projectId }: DocumentationPageProps) {
	return (
		<DocumentationProvider projectId={projectId}>
			<DocumentationPage projectId={projectId} />
		</DocumentationProvider>
	);
}

export default ContextWrapper;
