import { useEffect, useState } from "react";

interface ScrollHandler {
	hash: string;
}

function ScrollHandler({ hash }: ScrollHandler) {
	const [scrollProgress, setScrollProgress] = useState(0)
	useEffect(() => {
		if (hash) {
			const element = document.getElementById(hash);
			if (element) {
				element.scrollIntoView({ behavior: "smooth" });
			}
		}
	}, [hash]);

	useEffect(() => {
		const handleScroll = () => {
			const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
			const scrollPosition = window.scrollY
			const progress = (scrollPosition / totalHeight) * 100
			setScrollProgress(progress)
		}

		window.addEventListener("scroll", handleScroll)
		return () => window.removeEventListener("scroll", handleScroll)
	}, [])

	return (
		<div className="fixed top-0 left-0 right-0 h-1 z-50 bg-background/20">
			<div className="h-full bg-gradient-to-r from-teal-500 to-teal-300" style={{ width: `${scrollProgress}%` }} />
		</div>
	)
}

export default ScrollHandler;
