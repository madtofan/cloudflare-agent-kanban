import type { OrpcOutput } from "@cloudflare-agent-kanban/api/routers/index";
import { env } from "@cloudflare-agent-kanban/env/web";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { Camera, Check, Edit2, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

interface ProfilePageProps {
	publicProfile: OrpcOutput["profile"]["getByUsername"];
}

function getFullImageUrl(image: string | null | undefined): string | undefined {
	if (!image) {
		return undefined;
	}
	if (image.startsWith("http")) {
		return image;
	}
	return env.VITE_R2_PUBLIC_URL
		? `${env.VITE_R2_PUBLIC_URL}/${image}`
		: undefined;
}

function resizeImage(
	file: File,
	maxWidth: number,
	maxHeight: number
): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				let { width, height } = img;

				if (width > height) {
					if (width > maxWidth) {
						height = (height * maxWidth) / width;
						width = maxWidth;
					}
				} else if (height > maxHeight) {
					width = (width * maxHeight) / height;
					height = maxHeight;
				}

				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Failed to get canvas context"));
					return;
				}
				ctx.drawImage(img, 0, 0, width, height);
				resolve(canvas.toDataURL("image/jpeg", 0.9));
			};
			img.onerror = () => reject(new Error("Failed to load image"));
			img.src = e.target?.result as string;
		};
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsDataURL(file);
	});
}

function ProfilePage({ publicProfile }: ProfilePageProps) {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
	const [isEditingProjects, setIsEditingProjects] = useState(false);
	const [aboutMeValue, setAboutMeValue] = useState("");
	const [showcasedProjectIds, setShowcasedProjectIds] = useState<string[]>([]);

	const { data: session } = authClient.useSession();

	const { data: myProfile, isLoading: isLoadingMyProfile } = useQuery(
		orpc.profile.getMyProfile.queryOptions({
			enabled: session?.user.username === publicProfile.username,
		})
	);

	const isOwnProfile = session?.user?.id === publicProfile.id;
	const hasAboutMe = publicProfile.aboutMe && publicProfile.aboutMe.length > 0;
	const hasShowcasedProjects =
		publicProfile.showcasedProjects &&
		publicProfile.showcasedProjects.length > 0;

	const renderAboutMe = () => {
		if (isEditingAboutMe) {
			return (
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
			);
		}
		if (hasAboutMe) {
			return (
				<div
					className="prose prose-sm dark:prose-invert max-w-none"
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={{
						__html: publicProfile.aboutMe ?? "",
					}}
				/>
			);
		}
		return <p className="text-muted-foreground">No bio yet</p>;
	};

	const renderShowcasedProjects = () => {
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
		if (hasShowcasedProjects) {
			return (
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
			);
		}
		return <p className="text-muted-foreground">No showcased projects</p>;
	};

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

	const uploadImageMutation = useMutation(
		orpc.profile.uploadProfileImage.mutationOptions({
			onSuccess: () => {
				toast.success("Profile picture updated");
				if (!env.VITE_R2_PUBLIC_URL) {
					toast.warning(
						"Image uploaded but cannot be displayed locally. It will show after deployment."
					);
				}
				queryClient.invalidateQueries({
					queryKey: orpc.profile.getMyProfile.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.profile.getByUsername.queryKey({
						input: { username: publicProfile.username ?? "" },
					}),
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) {
			return;
		}

		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
		if (!allowedTypes.includes(file.type)) {
			toast.error("Please select a JPEG, PNG, or WebP image");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error("File size must be less than 5MB");
			return;
		}

		resizeImage(file, 256, 256)
			.then((resizedImage) => {
				uploadImageMutation.mutate({ image: resizedImage });
			})
			.catch(() => {
				toast.error("Failed to process image");
			});

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

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

	if (isLoadingMyProfile) {
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
					<div className="relative">
						<Avatar className="size-32">
							<AvatarImage src={getFullImageUrl(publicProfile.image)} />
							<AvatarFallback>
								{publicProfile.name?.[0]?.toUpperCase() ?? "?"}
							</AvatarFallback>
						</Avatar>
						{isOwnProfile && (
							<>
								<input
									accept="image/jpeg,image/png,image/webp"
									className="hidden"
									onChange={handleFileSelect}
									ref={fileInputRef}
									type="file"
								/>
								<Button
									className="absolute right-0 bottom-0 size-8 rounded-full p-0"
									disabled={uploadImageMutation.isPending}
									onClick={() => fileInputRef.current?.click()}
									size="sm"
								>
									{uploadImageMutation.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Camera className="h-4 w-4" />
									)}
								</Button>
							</>
						)}
					</div>
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

					{renderAboutMe()}
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

					{renderShowcasedProjects()}
				</div>
			</div>
		</div>
	);
}

export default ProfilePage;
