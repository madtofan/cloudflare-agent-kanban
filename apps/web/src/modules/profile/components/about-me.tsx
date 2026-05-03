import type { OrpcOutput } from "@cloudflare-agent-kanban/api/routers/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit2, Loader2, X } from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { orpc } from "@/utils/orpc";

interface AboutMeWrapperProps {
	myProfile?: OrpcOutput["profile"]["getMyProfile"];
	publicProfile: OrpcOutput["profile"]["getByUsername"];
}

interface AboutMeProps extends AboutMeWrapperProps {
	aboutMeValue: string;
	isEditingAboutMe: boolean;
	setAboutMeValue: Dispatch<SetStateAction<string>>;
	setIsEditingAboutMe: Dispatch<SetStateAction<boolean>>;
}

function AboutMe({
	aboutMeValue,
	isEditingAboutMe,
	setAboutMeValue,
	setIsEditingAboutMe,
}: AboutMeProps) {
	const queryClient = useQueryClient();

	const updateProfileMutation = useMutation(
		orpc.profile.updateProfile.mutationOptions({
			onSuccess: () => {
				toast.success("Profile about me updated");
				queryClient.invalidateQueries({
					queryKey: orpc.profile.getMyProfile.queryKey(),
				});
				setIsEditingAboutMe(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		})
	);

	const onSubmitEditing = () => {
		updateProfileMutation.mutate({ aboutMe: aboutMeValue });
	};

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
						onClick={onSubmitEditing}
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

	if (aboutMeValue) {
		return (
			<MarkdownRenderer
				className="prose prose-sm dark:prose-invert max-w-none"
				content={aboutMeValue}
			/>
		);
	}

	return <p className="text-muted-foreground">No bio yet</p>;
}

function AboutMeWrapper(props: AboutMeWrapperProps) {
	const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
	const [aboutMeValue, setAboutMeValue] = useState(
		props.publicProfile.aboutMe ?? ""
	);

	useEffect(() => {
		if (props.myProfile) {
			setAboutMeValue(props.myProfile.aboutMe ?? "");
		}
	}, [props.myProfile]);

	const startEditingAboutMe = () => {
		if (props.myProfile) {
			setAboutMeValue(props.publicProfile.aboutMe || "");
			setIsEditingAboutMe(true);
		}
	};

	return (
		<div className="mt-8">
			<div className="mb-2 flex items-center justify-between">
				<h2 className="font-semibold text-lg">About Me</h2>
				{props.myProfile && !isEditingAboutMe && (
					<Button onClick={startEditingAboutMe} size="sm" variant="ghost">
						<Edit2 className="mr-2 h-4 w-4" />
						Edit
					</Button>
				)}
			</div>

			<AboutMe
				{...props}
				aboutMeValue={aboutMeValue}
				isEditingAboutMe={isEditingAboutMe}
				setAboutMeValue={setAboutMeValue}
				setIsEditingAboutMe={setIsEditingAboutMe}
			/>
		</div>
	);
}

export default AboutMeWrapper;
