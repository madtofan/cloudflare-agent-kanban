import { Link } from "@tanstack/react-router";

function HeroSection() {
	return (
		<div className="container mx-auto px-4">
			<div className="mx-auto max-w-3xl text-center">
				<h1 className="font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
					Your Kanban Board, Your{" "}
					<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
						Portfolio
					</span>
				</h1>
				<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
					A free, powerful Kanban board that doubles as your personal portfolio.
					Showcase your projects, track your work, and let others see your
					journey.
				</p>
				<div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
					<Link
						className="inline-flex h-9 items-center justify-center gap-1.5 bg-primary px-2.5 font-medium text-primary-foreground text-sm hover:bg-primary/80"
						to="/login"
					>
						Get Started Free
					</Link>
					<Link
						className="inline-flex h-9 items-center justify-center gap-1.5 border border-border bg-background px-2.5 font-medium text-foreground text-sm hover:bg-muted"
						to="/demo"
					>
						View Demo Profile
					</Link>
				</div>
			</div>
		</div>
	);
}

export default HeroSection;
