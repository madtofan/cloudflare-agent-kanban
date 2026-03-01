import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { Check, Edit2, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

interface ProfilePageProps {
	username: string;
}

function ProfilePage({ username }: ProfilePageProps) {
	const queryClient = useQueryClient();

	const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
	const [isEditingProjects, setIsEditingProjects] = useState(false);
	const [aboutMeValue, setAboutMeValue] = useState("");
	const [showcasedProjectIds, setShowcasedProjectIds] = useState<string[]>([]);

	const { data: session } = authClient.useSession();

	const { data: publicProfile, isLoading: isLoadingPublic } = useQuery(
		orpc.profile.getByUsername.queryOptions({ input: { username } })
	);

	const { data: myProfile, isLoading: isLoadingMyProfile } = useQuery(
		orpc.profile.getMyProfile.queryOptions({
			enabled: session?.user.username === username,
		})
	);

	const isOwnProfile = session?.user?.id === publicProfile?.id;

	const updateProfileMutation = useMutation(
		orpc.profile.updateProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Profile updated");
				queryClient.invalidateQueries({
					queryKey: orpc.profile.getMyProfile.queryKey(),
				});
				setIsEditingAboutMe(false);
				setIsEditingProjects(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const handleSaveAboutMe = () => {
		updateProfileMutation.mutate({ aboutMe: aboutMeValue });
	};

	const handleSaveProjects = () => {
		updateProfileMutation.mutate({ showcasedProjectIds });
	};

	const startEditingAboutMe = () => {
		if (myProfile) {
			setAboutMeValue(myProfile.aboutMe || "");
			setIsEditingAboutMe(true);
		}
	};

	const startEditingProjects = () => {
		if (myProfile) {
			setShowcasedProjectIds(myProfile.showcasedProjectIds || []);
			setIsEditingProjects(true);
		}
	};

	if (isLoadingPublic || isLoadingMyProfile) {
		return (
			<div className="container mx-auto py-10">
				<div className="animate-pulse space-y-4">
					<div className="mx-auto h-32 w-32 rounded-full bg-muted" />
					<div className="mx-auto h-8 w-48 rounded bg-muted" />
					<div className="mx-auto h-4 w-96 rounded bg-muted" />
				</div>
			</div>
		);
	}

	if (!publicProfile) {
		throw notFound();
	}

	return (
		<div className="container mx-auto py-10">
			<div className="mx-auto max-w-2xl">
				<div className="flex flex-col items-center text-center">
					<Avatar className="size-32">
						<AvatarImage src={publicProfile.image ?? undefined} />
						<AvatarFallback>
							{publicProfile.name?.[0]?.toUpperCase() ?? "?"}
						</AvatarFallback>
					</Avatar>
					<h1 className="mt-4 font-bold text-3xl">
						{publicProfile.displayUsername || publicProfile.username}
					</h1>
					<p className="text-muted-foreground">{publicProfile.name}</p>
				</div>

				<div className="mt-8">
					<div className="mb-2 flex items-center justify-between">
						<h2 className="font-semibold text-lg">About Me</h2>
						{isOwnProfile && !isEditingAboutMe && (
							<Button onClick={startEditingAboutMe} size="sm" variant="ghost">
								<Edit2 className="mr-2 h-4 w-4" />
								Edit
							</Button>
						)}
					</div>

					{isEditingAboutMe ? (
						<div className="space-y-2">
							<RichTextEditor
								className="min-h-[200px]"
								onChange={setAboutMeValue}
								placeholder="Tell others about yourself..."
								value={aboutMeValue}
							/>
							<div className="flex justify-end gap-2">
								<Button
									onClick={() => setIsEditingAboutMe(false)}
									size="sm"
									variant="ghost"
								>
									<X className="mr-2 h-4 w-4" />
									Cancel
								</Button>
								<Button
									disabled={updateProfileMutation.isPending}
									onClick={handleSaveAboutMe}
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
					) : publicProfile.aboutMe ? (
						<div
							className="prose prose-sm dark:prose-invert max-w-none"
							dangerouslySetInnerHTML={{ __html: publicProfile.aboutMe }}
						/>
					) : (
						<p className="text-muted-foreground">No bio yet</p>
					)}
				</div>

				<div className="mt-8">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-lg">Showcased Projects</h2>
						{isOwnProfile && !isEditingProjects && (
							<Button onClick={startEditingProjects} size="sm" variant="ghost">
								<Edit2 className="mr-2 h-4 w-4" />
								Edit
							</Button>
						)}
					</div>

					{isEditingProjects ? (
						<div className="space-y-2">
							{myProfile?.publicProjects &&
							myProfile.publicProjects.length > 0 ? (
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
																showcasedProjectIds.filter(
																	(id) => id !== project.id
																)
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
									You don't have any public projects
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
					) : publicProfile.showcasedProjects &&
						publicProfile.showcasedProjects.length > 0 ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{publicProfile.showcasedProjects.map(
								(project: {
									id: string;
									name: string;
									description: string | null;
								}) => (
									<a
										className="block rounded-lg border p-4 transition-colors hover:bg-accent"
										href={`/projects/${project.id}`}
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
					) : (
						<p className="text-muted-foreground">No showcased projects</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default ProfilePage;
