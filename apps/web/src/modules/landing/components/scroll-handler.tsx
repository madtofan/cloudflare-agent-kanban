import { useEffect, useState } from "react";
import type { LinkType } from "../types";

interface ScrollHandler {
	active: string;
	hash: string;
	links: LinkType[];
	setActive: (linkLabel: string) => void;
}

function ScrollHandler({ active, hash, links, setActive }: ScrollHandler) {
	const [scrollProgress, setScrollProgress] = useState(0);
	useEffect(() => {
		if (hash) {
			const element = document.getElementById(hash);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
			}
		}
	}, [hash]);

	useEffect(() => {
		const handleScroll = () => {
			const totalHeight =
				document.documentElement.scrollHeight -
				document.documentElement.clientHeight;
			const scrollPosition = window.scrollY;
			const progress = (scrollPosition / totalHeight) * 100;
			setScrollProgress(progress);
			const newActive = links.findLast(link => {
				if (!link.ref?.current) {
					return false;
				}
				return link.ref.current.getBoundingClientRect().top < scrollPosition
			});
			if (newActive && newActive.label !== active) {
				setActive(newActive.label);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [active, links, setActive]);

	return (
		<div className="fixed top-0 right-0 left-0 z-50 h-1 bg-background/20">
			<div
				className="h-full bg-gradient-to-r from-teal-500 to-teal-300"
				style={{ width: `${scrollProgress}%` }}
			/>
		</div>
	);
}

export default ScrollHandler;
