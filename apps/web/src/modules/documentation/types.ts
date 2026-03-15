export interface FolderWithChildren {
	children: FolderWithChildren[];
	id: string;
	name: string;
	pages: PageWithAuthor[];
	parentFolderId: string | null;
}

export interface PageWithAuthor {
	author: {
		id: string;
		name: string;
		image: string | null;
	};
	folderId: string | null;
	id: string;
	title: string;
	updatedAt: Date;
	visibility: "public" | "private";
}

export interface DocumentItem {
	id: string;
	type: "Page" | "Folder";
}
