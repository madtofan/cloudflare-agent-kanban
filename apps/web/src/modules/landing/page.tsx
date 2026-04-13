import { Link } from "@tanstack/react-router";
import Header from "@/components/header";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";
import ContactSection from "./components/contact";
import FeaturesSection from "./components/features";
import Footer from "./components/footer";
import HeroSection from "./components/hero";

function LandingPage() {
	const links = [
		{ to: "/", label: "Home" },
		{ to: "/app", label: "Dashboard" },
		{ to: "/app/projects", label: "Projects" },
	] as const;

	return (
		<>
			<Header className="justify-between">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<Link key={to} to={to}>
								{label}
							</Link>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</Header>

			<main className="min-h-0 overflow-auto bg-background/50 bg-grid">
				<div className="min-h-screen">
					<section className="relative overflow-hidden py-20 sm:py-32">
						<HeroSection />
					</section>

					<section className="container mx-auto px-4 py-16">
						<FeaturesSection />
					</section>

					<section className="container mx-auto px-4 py-16">
						<ContactSection />
					</section>

					<Footer />
				</div>
			</main>
		</>
	);
}

export default LandingPage;
