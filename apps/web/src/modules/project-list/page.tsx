import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Globe, Loader2, Lock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	generateProjectListParams,
	useBreadcrumb,
} from "@/components/ui/breadcrumb";
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
import ProjectListCards from "./components/project-list-cards";

function ProjectListPage() {
	const navigate = useNavigate();
	const [newProjectName, setNewProjectName] = useState("");
	const [newProjectVisibility, setNewProjectVisibility] = useState<
		"private" | "public"
	>("private");
	const [isCreating, setIsCreating] = useState(false);
	const { addBreadcrumb } = useBreadcrumb();

	useEffect(() => {
		addBreadcrumb(...generateProjectListParams());
	}, [addBreadcrumb]);

	const createMutation = useMutation(
		orpc.project.create.mutationOptions({
			onSuccess: (data) => {
				toast.success("Project created successfully");
				setNewProjectName("");
				setNewProjectVisibility("private");
				setIsCreating(false);
				navigate({
					to: "/app/projects/$projectId",
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

			<ProjectListCards />
		</div>
	);
}

export default ProjectListPage;
