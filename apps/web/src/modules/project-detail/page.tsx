import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	Globe,
	LayoutGrid,
	Loader2,
	Plus,
	Settings,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";
import ProjectMembersSheet from "./components/project-members-sheet";

interface ProjectDetailPageProps {
	projectId: string;
}

function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
	const navigate = useNavigate();
	const [newBoardName, setNewBoardName] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [isMembersOpen, setIsMembersOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const { data: session } = authClient.useSession();

	const project = useQuery(
		orpc.project.getById.queryOptions({ input: { projectId } })
	);
	const boards = useQuery(
		orpc.project.getBoards.queryOptions({ input: { projectId } })
	);

	const createMutation = useMutation(
		orpc.board.create.mutationOptions({
			onSuccess: (data) => {
				toast.success("Board created successfully");
				setNewBoardName("");
				setIsCreating(false);
				navigate({
					to: "/projects/$projectId/boards/$boardId",
					params: { boardId: data.id, projectId },
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const updateProjectMutation = useMutation(
		orpc.project.update.mutationOptions({
			onSuccess: () => {
				toast.success("Project updated");
				project.refetch();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const handleCreateBoard = (e: React.FormEvent) => {
		e.preventDefault();
		if (newBoardName.trim()) {
			createMutation.mutate({ name: newBoardName, projectId });
		}
	};

	const userId = session?.user.id;
	const isOwner = project.data?.ownerId === userId;

	if (project.isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (project.isError) {
		return (
			<div className="container mx-auto py-10">
				<p className="text-red-500">Project not found</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-10">
			<div className="mb-8 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button
						onClick={() => navigate({ to: "/projects" })}
						size="icon"
						variant="ghost"
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="font-bold text-3xl">{project.data?.name}</h1>
						<p className="text-muted-foreground">
							{project.data?.description || "Manage your boards"}
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					{isOwner && (
						<>
							<Button onClick={() => setIsSettingsOpen(true)} variant="outline">
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Button>
							<Button onClick={() => setIsMembersOpen(true)} variant="outline">
								<Users className="mr-2 h-4 w-4" />
								Members
							</Button>
						</>
					)}
					<Button onClick={() => setIsCreating(!isCreating)}>
						<Plus className="mr-2 h-4 w-4" />
						New Board
					</Button>
				</div>
			</div>

			{isCreating && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Create New Board</CardTitle>
						<CardDescription>Give your board a name</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							className="flex items-center space-x-2"
							onSubmit={handleCreateBoard}
						>
							<Input
								autoFocus
								disabled={createMutation.isPending}
								onChange={(e) => setNewBoardName(e.target.value)}
								placeholder="Board name..."
								value={newBoardName}
							/>
							<Button
								disabled={createMutation.isPending || !newBoardName.trim()}
								type="submit"
							>
								{createMutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									"Create"
								)}
							</Button>
							<Button
								onClick={() => setIsCreating(false)}
								type="button"
								variant="ghost"
							>
								Cancel
							</Button>
						</form>
					</CardContent>
				</Card>
			)}

			{boards.isLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin" />
				</div>
			) : boards.data?.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="font-semibold text-lg">No boards in this project</h3>
					<p className="text-muted-foreground">
						Create your first board to get started
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{boards.data?.map((board) => (
						<Card
							className="cursor-pointer transition-shadow hover:shadow-md"
							key={board.id}
							onClick={() =>
								navigate({
									to: "/projects/$projectId/boards/$boardId",
									params: { boardId: board.id, projectId },
								})
							}
						>
							<CardHeader>
								<CardTitle className="truncate">{board.name}</CardTitle>
								{board.description && (
									<CardDescription className="line-clamp-2">
										{board.description}
									</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-xs">
									Created{" "}
									{board.createdAt
										? new Date(board.createdAt).toLocaleDateString()
										: "recently"}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			<ProjectMembersSheet
				currentUserId={userId}
				onOpenChange={setIsMembersOpen}
				open={isMembersOpen}
				ownerId={project.data?.ownerId}
				projectId={projectId}
			/>

			<Dialog onOpenChange={setIsSettingsOpen} open={isSettingsOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Project Settings</DialogTitle>
						<DialogDescription>
							Manage your project settings and visibility
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Project Name</Label>
							<Input
								className="bg-muted"
								disabled
								value={project.data?.name || ""}
							/>
						</div>
						<div className="space-y-2">
							<Label>Visibility</Label>
							<div className="flex gap-2">
								<Button
									disabled={updateProjectMutation.isPending}
									onClick={() => {
										updateProjectMutation.mutate({
											projectId,
											visibility: "private",
										});
									}}
									size="sm"
									variant={
										project.data?.visibility === "private"
											? "default"
											: "outline"
									}
								>
									<Globe className="mr-2 h-4 w-4" />
									Private
								</Button>
								<Button
									disabled={updateProjectMutation.isPending}
									onClick={() => {
										updateProjectMutation.mutate({
											projectId,
											visibility: "public",
										});
									}}
									size="sm"
									variant={
										project.data?.visibility === "public"
											? "default"
											: "outline"
									}
								>
									<Globe className="mr-2 h-4 w-4" />
									Public
								</Button>
							</div>
							<p className="text-muted-foreground text-sm">
								{project.data?.visibility === "public"
									? "Anyone can view this project"
									: "Only members can view this project"}
							</p>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default ProjectDetailPage;
