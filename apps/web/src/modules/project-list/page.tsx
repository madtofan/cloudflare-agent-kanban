import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FolderKanban, Globe, Loader2, Lock, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/utils/orpc";

function ProjectListPage() {
	const navigate = useNavigate();
	const [newProjectName, setNewProjectName] = useState("");
	const [newProjectVisibility, setNewProjectVisibility] = useState<
		"private" | "public"
	>("private");
	const [isCreating, setIsCreating] = useState(false);

	const projects = useQuery(orpc.project.getAll.queryOptions());

	const createMutation = useMutation(
		orpc.project.create.mutationOptions({
			onSuccess: (data) => {
				toast.success("Project created successfully");
				setNewProjectName("");
				setNewProjectVisibility("private");
				setIsCreating(false);
				navigate({
					to: "/projects/$projectId",
					params: { projectId: data.id },
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const handleCreateProject = (e: React.FormEvent) => {
		e.preventDefault();
		if (newProjectName.trim()) {
			createMutation.mutate({
				name: newProjectName,
				visibility: newProjectVisibility,
			});
		}
	};

	return (
		<div className="container mx-auto p-10">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Projects</h1>
					<p className="text-muted-foreground">Manage your projects</p>
				</div>
				<Button onClick={() => setIsCreating(!isCreating)}>
					<Plus className="mr-2 h-4 w-4" />
					New Project
				</Button>
			</div>

			{isCreating && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Create New Project</CardTitle>
						<CardDescription>
							Give your project a name and visibility
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={handleCreateProject}>
							<Input
								autoFocus
								disabled={createMutation.isPending}
								onChange={(e) => setNewProjectName(e.target.value)}
								placeholder="Project name..."
								value={newProjectName}
							/>
							<div className="flex items-center gap-4">
								<div className="space-y-2">
									<Label>Visibility</Label>
									<div className="flex gap-2">
										<Button
											onClick={() => setNewProjectVisibility("private")}
											size="sm"
											type="button"
											variant={
												newProjectVisibility === "private"
													? "default"
													: "outline"
											}
										>
											<Lock className="mr-2 h-4 w-4" />
											Private
										</Button>
										<Button
											onClick={() => setNewProjectVisibility("public")}
											size="sm"
											type="button"
											variant={
												newProjectVisibility === "public"
													? "default"
													: "outline"
											}
										>
											<Globe className="mr-2 h-4 w-4" />
											Public
										</Button>
									</div>
								</div>
								<div className="flex-1" />
								<Button
									onClick={() => setIsCreating(false)}
									type="button"
									variant="ghost"
								>
									Cancel
								</Button>
								<Button
									disabled={createMutation.isPending || !newProjectName.trim()}
									type="submit"
								>
									{createMutation.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										"Create"
									)}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{projects.isLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin" />
				</div>
			) : projects.data?.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="font-semibold text-lg">No projects yet</h3>
					<p className="text-muted-foreground">
						Create your first project to get started
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{projects.data?.map((project) => (
						<Card
							className="cursor-pointer transition-shadow hover:shadow-md"
							key={project.id}
							onClick={() =>
								navigate({
									to: "/projects/$projectId",
									params: { projectId: project.id },
								})
							}
						>
							<CardHeader>
								<CardTitle className="truncate">{project.name}</CardTitle>
								{project.description && (
									<CardDescription className="line-clamp-2">
										{project.description}
									</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground text-xs">
									Created{" "}
									{project.createdAt
										? new Date(project.createdAt).toLocaleDateString()
										: "recently"}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

export default ProjectListPage;
