import type { OrpcOutput } from "@cloudflare-agent-kanban/api/routers/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit2, Loader2, X } from "lucide-react";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

interface ShowcaseProjectWrapperProps {
	myProfile?: OrpcOutput["profile"]["getMyProfile"];
	publicProfile: OrpcOutput["profile"]["getByUsername"];
}

interface ShowcaseProjectsProps extends ShowcaseProjectWrapperProps {
	isEditingProjects: boolean;
	setIsEditingProjects: Dispatch<SetStateAction<boolean>>;
	setShowcasedProjectIds: Dispatch<SetStateAction<string[]>>;
	showcasedProjectIds: string[];
}

function ShowcaseProjects({
	myProfile,
	publicProfile,
	isEditingProjects,
	showcasedProjectIds,
	setIsEditingProjects,
	setShowcasedProjectIds,
}: ShowcaseProjectsProps) {
	const queryClient = useQueryClient();

	const updateProfileMutation = useMutation(
		orpc.profile.updateProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Profile project showcase updated");
				queryClient.invalidateQueries({
					queryKey: orpc.profile.getMyProfile.queryKey(),
				});
				setIsEditingProjects(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const handleSaveProjects = () => {
		updateProfileMutation.mutate({ showcasedProjectIds });
	};

	const showcaseProject = useMemo(() => {
		if (myProfile) {
			const selectedProjectSet = new Set<string>();
			for (const projectId of myProfile.showcasedProjectIds) {
				selectedProjectSet.add(projectId);
			}
			return myProfile.publicProjects.filter((project) =>
				selectedProjectSet.has(project.id)
			);
		}

		return publicProfile.showcasedProjects;
	}, [myProfile, publicProfile.showcasedProjects]);

	if (isEditingProjects) {
		return (
			<div className="space-y-2">
				{myProfile?.publicProjects && myProfile.publicProjects.length > 0 ? (
					<div className="space-y-2">
						{myProfile.publicProjects.map(
							(project: { id: string; name: string }) => (
								<label
									className="flex items-center gap-2 rounded-md border p-3"
									key={project.id}
								>
									<input
										checked={showcasedProjectIds.includes(project.id)}
										className="h-4 w-4"
										onChange={(e) => {
											if (e.target.checked) {
												setShowcasedProjectIds([
													...showcasedProjectIds,
													project.id,
												]);
											} else {
												setShowcasedProjectIds(
													showcasedProjectIds.filter((id) => id !== project.id)
												);
											}
										}}
										type="checkbox"
									/>
									<span>{project.name}</span>
								</label>
							)
						)}
					</div>
				) : (
					<p className="text-muted-foreground">
						You don&apos;t have any public projects
					</p>
				)}
				<div className="flex justify-end gap-2 pt-2">
					<Button
						onClick={() => setIsEditingProjects(false)}
						size="sm"
						variant="ghost"
					>
						<X className="mr-2 h-4 w-4" />
						Cancel
					</Button>
					<Button
						disabled={updateProfileMutation.isPending}
						onClick={handleSaveProjects}
						size="sm"
					>
						{updateProfileMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Check className="mr-2 h-4 w-4" />
						)}
						Save
					</Button>
				</div>
			</div>
		);
	}

	if (showcaseProject.length > 0) {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{showcaseProject.map(
					(project: {
						id: string;
						name: string;
						description: string | null;
					}) => (
						<a
							className="block rounded-lg border p-4 transition-colors hover:bg-accent"
							href={`/app/projects/${project.id}`}
							key={project.id}
						>
							<h3 className="font-semibold">{project.name}</h3>
							{project.description && (
								<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
									{project.description}
								</p>
							)}
						</a>
					)
				)}
			</div>
		);
	}
	return <p className="text-muted-foreground">No showcased projects</p>;
}

function ShowcaseProjectWrapper(props: ShowcaseProjectWrapperProps) {
	const [isEditingProjects, setIsEditingProjects] = useState(false);
	const [showcasedProjectIds, setShowcasedProjectIds] = useState<string[]>([]);

	const startEditingProjects = () => {
		if (props.myProfile) {
			setShowcasedProjectIds(
				props.publicProfile.showcasedProjects.map((project) => project.id)
			);
			setIsEditingProjects(true);
		}
	};

	return (
		<div className="mt-8">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-semibold text-lg">Showcased Projects</h2>
				{props.myProfile && !isEditingProjects && (
					<Button onClick={startEditingProjects} size="sm" variant="ghost">
						<Edit2 className="mr-2 h-4 w-4" />
						Edit
					</Button>
				)}
			</div>

			<ShowcaseProjects
				{...props}
				isEditingProjects={isEditingProjects}
				setIsEditingProjects={setIsEditingProjects}
				setShowcasedProjectIds={setShowcasedProjectIds}
				showcasedProjectIds={showcasedProjectIds}
			/>
		</div>
	);
}

export default ShowcaseProjectWrapper;
