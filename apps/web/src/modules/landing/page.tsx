import { Link } from "@tanstack/react-router";
import { useState } from "react";
import Header from "@/components/header";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";
import ContactSection from "./components/contact";
import FeaturesSection from "./components/features";
import Footer from "./components/footer";
import HeroSection from "./components/hero";
import ScrollHandler from "./components/scroll-handler";

interface LandingPageProps {
	user?: {
		name: string;
		email: string;
	}
}

function LandingPage({ user }: LandingPageProps) {
	const [hash, setHash] = useState("");
	const links = [
		{ to: "/", label: "Home", hash: "hero" },
		{ to: "/", label: "Features", hash: "features" },
		{ to: "/", label: "Contact", hash: "contact" },
	] as const;

	return (
		<>
			<Header className="justify-between">
				<ScrollHandler hash={hash} />
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label, hash }) => {
						return (
							<Link key={`${to}${hash}`} onClick={() => setHash(hash)} to={to}>
								{label}
							</Link>
						);
					})}
					{user && (
						<Link to="/app">
							Dashboard
						</Link>
					)}
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu user={user} />
				</div>
			</Header>

			<main className="min-h-0 overflow-auto scroll-smooth bg-background/50 bg-grid">
				<div className="min-h-screen">
					<section
						className="relative overflow-hidden py-20 sm:py-32"
						id="hero"
					>
						<HeroSection />
					</section>

					<section className="container mx-auto px-4 py-16" id="features">
						<FeaturesSection />
					</section>

					<section className="container mx-auto px-4 py-16" id="contact">
						<ContactSection />
					</section>

					<Footer />
				</div>
			</main>
		</>
	);
}

export default LandingPage;
