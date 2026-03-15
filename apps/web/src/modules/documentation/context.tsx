// biome-ignore-all lint/suspicious/noEmptyBlockStatements: initialize context
import type { OrpcOutput } from "@cloudflare-agent-kanban/api/routers/index";
import { useQuery } from "@tanstack/react-query";
import {
	createContext,
	type ReactElement,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { orpc } from "@/utils/orpc";
import type { DocumentItem } from "./types";

interface DocumentationContextType {
	currentPage?: OrpcOutput["documentation"]["getPage"];
	folders?: OrpcOutput["documentation"]["getFolders"];
	isEditing: boolean;
	isLoadingCurrentPage: boolean;
	isLoadingFolders: boolean;
	isLoadingPages: boolean;
	pages?: OrpcOutput["documentation"]["getPages"];
	refetchCurrentPage: () => void;
	refetchFolder: () => void;
	refetchPages: () => void;
	selectedItem: DocumentItem | null;
	updateIsEditing: (isEditing: boolean) => void;
	updateSelectedItem: (item: DocumentItem | null) => void;
}

const DocumentationContext = createContext<DocumentationContextType>({
	selectedItem: null,
	isEditing: false,
	isLoadingFolders: true,
	isLoadingPages: true,
	isLoadingCurrentPage: true,
	refetchCurrentPage: () => {},
	refetchFolder: () => {},
	refetchPages: () => {},
	updateSelectedItem: () => {},
	updateIsEditing: () => {},
});

export const useDocumentationContext = () => {
	const context = useContext(DocumentationContext);
	return context;
};

interface DocumentationProviderProps {
	children: ReactNode;
	projectId: string;
}

export function DocumentationProvider({
	children,
	projectId,
}: DocumentationProviderProps): ReactElement {
	const [selectedItem, setSelectedItem] = useState<DocumentItem | null>(null);
	const [isEditing, setIsEditing] = useState(false);

	const {
		data: folders,
		refetch: refetchFolder,
		isLoading: isLoadingFolders,
	} = useQuery(
		orpc.documentation.getFolders.queryOptions({ input: { projectId } })
	);

	const {
		data: currentPage,
		refetch: refetchCurrentPage,
		isLoading: isLoadingCurrentPage,
	} = useQuery(
		orpc.documentation.getPage.queryOptions({
			input: { pageId: selectedItem?.id ?? "" },
			enabled: selectedItem?.type === "Page",
		})
	);

	const {
		data: pages,
		refetch: refetchPages,
		isLoading: isLoadingPages,
	} = useQuery(
		orpc.documentation.getPages.queryOptions({ input: { projectId } })
	);

	const updateSelectedItem = useCallback((item: DocumentItem | null) => {
		setSelectedItem(item);
		setIsEditing(false);
	}, []);

	const contextValue = useMemo<DocumentationContextType>(
		() => ({
			currentPage,
			selectedItem,
			folders,
			isEditing,
			isLoadingFolders,
			isLoadingPages,
			isLoadingCurrentPage,
			pages,
			refetchCurrentPage,
			refetchFolder,
			refetchPages,
			updateIsEditing: setIsEditing,
			updateSelectedItem,
		}),
		[
			currentPage,
			selectedItem,
			folders,
			isEditing,
			isLoadingFolders,
			isLoadingPages,
			isLoadingCurrentPage,
			pages,
			refetchCurrentPage,
			refetchFolder,
			refetchPages,
			updateSelectedItem,
		]
	);

	return (
		<DocumentationContext.Provider value={contextValue}>
			{children}
		</DocumentationContext.Provider>
	);
}
