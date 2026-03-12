import { Check, Palette, User } from "lucide-react";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function FeaturesSection() {
	return (
		<div className="mx-auto max-w-5xl">
			<h2 className="mb-12 text-center font-bold text-3xl">
				Why Choose Our Kanban Board?
			</h2>
			<div className="grid gap-8 md:grid-cols-3">
				<Card>
					<CardHeader>
						<div className="mb-4 inline-flex size-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
							<Check className="size-6 text-blue-600 dark:text-blue-400" />
						</div>
						<CardTitle>Free Forever</CardTitle>
						<CardDescription>
							Full-featured Kanban board with no paywalls. Create unlimited
							boards, projects, and cards at no cost.
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<div className="mb-4 inline-flex size-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900">
							<User className="size-6 text-violet-600 dark:text-violet-400" />
						</div>
						<CardTitle>Portfolio Built-In</CardTitle>
						<CardDescription>
							Transform your project boards into a stunning public portfolio.
							Share your work with the world.
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<div className="mb-4 inline-flex size-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
							<Palette className="size-6 text-emerald-600 dark:text-emerald-400" />
						</div>
						<CardTitle>Fully Customizable</CardTitle>
						<CardDescription>
							Tailor your profile page to stand out. Add a bio, showcase your
							best projects, and tell your story.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		</div>
	);
}

export default FeaturesSection;
