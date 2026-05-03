import type { OrpcOutput } from "@cloudflare-agent-kanban/api/routers/index";
import { env } from "@cloudflare-agent-kanban/env/web";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Camera, Loader2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import Header from "@/components/header";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/user-menu";
import { orpc } from "@/utils/orpc";
import AboutMe from "./components/about-me";
import ShowcaseProjects from "./components/showcase-projects";
import { HEADER_LINKS } from "./constants";
import { getFullImageUrl, resizeImage } from "./utils";

interface ProfilePageProps {
	isLoggedInUser: boolean;
	publicProfile: OrpcOutput["profile"]["getByUsername"];
	user?: {
		name: string;
		email: string;
	};
}

function ProfilePage({
	user,
	publicProfile,
	isLoggedInUser,
}: ProfilePageProps) {
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { data: myProfile } = useQuery(
		orpc.profile.getMyProfile.queryOptions({
			enabled: isLoggedInUser,
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

	return (
		<>
			<Header className="justify-between">
				<nav className="flex gap-4 text-lg">
					{HEADER_LINKS.map(({ to, label }) => {
						return (
							<Link key={to} to={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu user={user} />
				</div>
			</Header>
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
							{isLoggedInUser && (
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

					<AboutMe myProfile={myProfile} publicProfile={publicProfile} />

					<ShowcaseProjects
						myProfile={myProfile}
						publicProfile={publicProfile}
					/>
				</div>
			</div>
		</>
	);
}

export default ProfilePage;
