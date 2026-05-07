import { Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import Header from "@/components/header";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";
import { cn } from "@/lib/utils";
import ContactSection from "./components/contact";
import FeaturesSection from "./components/features";
import Footer from "./components/footer";
import HeroSection from "./components/hero";
import ScrollHandler from "./components/scroll-handler";
import type { LinkType } from "./types";

interface LandingPageProps {
	user?: {
		name: string;
		email: string;
	};
}

function LandingPage({ user }: LandingPageProps) {
	const [hash, setHash] = useState("");
	const [active, setActive] = useState("HOME");
	const heroRef = useRef<HTMLDivElement>(null);
	const featuresRef = useRef<HTMLDivElement>(null);
	const contactRef = useRef<HTMLDivElement>(null);
	const links = useMemo<LinkType[]>(
		() => [
			{ to: "/", label: "HOME", hash: "hero", ref: heroRef },
			{ to: "/", label: "FEATURES", hash: "features", ref: featuresRef },
			{ to: "/", label: "CONTACT", hash: "contact", ref: contactRef },
		],
		[]
	);

	return (
		<>
			<Header className="justify-between">
				<ScrollHandler
					active={active}
					hash={hash}
					links={links}
					setActive={setActive}
				/>
				<nav className="flex items-center text-xs">
					<h3 className="mr-10 font-bold text-3xl tracking-tight">BINA-IT</h3>
					<div className="flex flex-row items-end gap-10">
						{links.map(({ to, label, hash }, index) => {
							return (
								<Link
									className={cn(
										"flex flex-row space-x-2",
										active === label ? "border-b pb-1" : "text-muted-foreground"
									)}
									key={`${to}${hash}`}
									onClick={() => setHash(hash as string)}
									to={to}
								>
									<span className="content-center">
										{(index + 1).toString().padStart(2, "0")}
									</span>
									<span className="pb-1">{"//"}</span>
									<span className="content-center">{label}</span>
								</Link>
							);
						})}
						{user && (
							<Link
								className="flex flex-row space-x-2 text-muted-foreground"
								to="/app"
							>
								<span className="content-center">04</span>
								<span className="pb-1">{"//"}</span>
								<span className="content-center">DASHBOARD</span>
							</Link>
						)}
					</div>
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
						ref={heroRef}
					>
						<HeroSection />
					</section>

					<section
						className="container mx-auto px-4 py-16"
						id="features"
						ref={featuresRef}
					>
						<FeaturesSection />
					</section>

					<section
						className="container mx-auto px-4 py-16"
						id="contact"
						ref={contactRef}
					>
						<ContactSection />
					</section>

					<Footer />
				</div>
			</main>
		</>
	);
}

export default LandingPage;
