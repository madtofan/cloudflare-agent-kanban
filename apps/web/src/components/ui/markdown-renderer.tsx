import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
	className?: string;
	content: string;
}

export function MarkdownRenderer({
	content,
	className,
}: MarkdownRendererProps) {
	if (!content) {
		return null;
	}

	return (
		<div className={cn("prose prose-sm dark:prose-invert", className)}>
			<ReactMarkdown>{content}</ReactMarkdown>
		</div>
	);
}
