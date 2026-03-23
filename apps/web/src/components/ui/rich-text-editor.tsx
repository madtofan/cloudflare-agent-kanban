import "reactjs-tiptap-editor/style.css";

import Document from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { ListItem } from "@tiptap/extension-list";
import Paragraph from "@tiptap/extension-paragraph";
import { Text as TiptapText } from "@tiptap/extension-text";
import { TextStyle } from "@tiptap/extension-text-style";
import {
	Dropcursor,
	Gapcursor,
	Placeholder,
	TrailingNode,
} from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { RichTextProvider } from "reactjs-tiptap-editor";
import {
	Blockquote,
	RichTextBlockquote,
} from "reactjs-tiptap-editor/blockquote";
import { Bold, RichTextBold } from "reactjs-tiptap-editor/bold";
import {
	RichTextBubbleLink,
	RichTextBubbleText,
} from "reactjs-tiptap-editor/bubble";
import {
	BulletList,
	RichTextBulletList,
} from "reactjs-tiptap-editor/bulletlist";
import { CodeBlock, RichTextCodeBlock } from "reactjs-tiptap-editor/codeblock";
import { Color, RichTextColor } from "reactjs-tiptap-editor/color";
import { Heading, RichTextHeading } from "reactjs-tiptap-editor/heading";
import { Highlight, RichTextHighlight } from "reactjs-tiptap-editor/highlight";
import {
	History,
	RichTextRedo,
	RichTextUndo,
} from "reactjs-tiptap-editor/history";
import { Italic, RichTextItalic } from "reactjs-tiptap-editor/italic";
import { Link, RichTextLink } from "reactjs-tiptap-editor/link";
import {
	OrderedList,
	RichTextOrderedList,
} from "reactjs-tiptap-editor/orderedlist";
import { RichTextStrike, Strike } from "reactjs-tiptap-editor/strike";
import { RichTextTaskList, TaskList } from "reactjs-tiptap-editor/tasklist";
import {
	RichTextUnderline,
	TextUnderline,
} from "reactjs-tiptap-editor/textunderline";
import { Markdown } from "tiptap-markdown";
import { themeActions } from 'reactjs-tiptap-editor/theme';
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
	className?: string;
	id?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	value: string;
}

export function RichTextEditor({
	value,
	onChange,
	placeholder = "",
	className,
}: RichTextEditorProps) {
	const [isFocused, setIsFocused] = useState(false);
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		if (resolvedTheme === 'light') {
			themeActions.setTheme('light');
			return;
		}
		if (resolvedTheme === 'dark') {
			themeActions.setTheme('dark');
			return;
		}
	}, [resolvedTheme]);

	const extensions = useMemo(
		() => [
			Document,
			TiptapText,
			Paragraph,
			Dropcursor,
			Gapcursor,
			HardBreak,
			TrailingNode,
			ListItem,
			TextStyle,
			Placeholder.configure({ placeholder }),
			Bold,
			Italic,
			TextUnderline,
			Strike,
			Heading.configure({ levels: [1, 2, 3] }),
			BulletList,
			OrderedList,
			TaskList.configure({ taskItem: { nested: true } }),
			Blockquote,
			CodeBlock,
			Link.configure({ openOnClick: false }),
			Color,
			Highlight.configure({ multicolor: true }),
			History,
			Markdown,
		],
		[placeholder]
	);

	const editor = useEditor({
		extensions,
		content: value || "",
		onUpdate: ({ editor }) => {
			const markdownEditor = editor as unknown as {
				storage: { markdown: { getMarkdown: () => string } };
			};
			onChange(markdownEditor.storage.markdown.getMarkdown());
		},
		onFocus: () => setIsFocused(true),
		onBlur: () => setIsFocused(false),
		editorProps: {
			attributes: {
				class: "max-w-none focus:outline-none p-1",
			},
		},
	});

	useEffect(() => {
		if (editor) {
			const markdownEditor = editor as unknown as {
				storage: { markdown: { getMarkdown: () => string } };
			};
			const currentMarkdown = markdownEditor.storage.markdown.getMarkdown();
			if (value !== currentMarkdown) {
				editor.commands.setContent(value || "", {
					contentType: "markdown",
				} as Parameters<typeof editor.commands.setContent>[1]);
			}
		}
	}, [value, editor]);

	if (!editor) {
		return null;
	}

	return (
		<div className="border">
			<RichTextProvider editor={editor}>
				<div
					className={cn(
						"relative flex max-h-full flex-col rounded-md bg-background transition-all duration-200",
						className
					)}
				>
					{isFocused && (
						<div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1"
							onMouseDown={(e) => {
								if (isFocused) {
									e.preventDefault();
								}
							}}
							role="none"
						>
							<RichTextBold />
							<RichTextItalic />
							<RichTextStrike />
							<RichTextUnderline />

							<div className="mx-1 h-6 w-px bg-border" />

							<RichTextHeading />

							<div className="mx-1 h-6 w-px bg-border" />

							<RichTextBulletList />
							<RichTextOrderedList />
							<RichTextTaskList />

							<div className="mx-1 h-6 w-px bg-border" />

							<RichTextBlockquote />
							<RichTextCodeBlock />

							<div className="mx-1 h-6 w-px bg-border" />

							<RichTextLink />
							<RichTextColor />
							<RichTextHighlight />

							<div className="mx-1 h-6 w-px bg-border" />

							<RichTextUndo />
							<RichTextRedo />

							<RichTextBubbleLink />
							<RichTextBubbleText />
						</div>
					)}

					<div className={cn("flex-1 overflow-hidden")}>
						<div
							className={cn(
								"h-full overflow-y-auto",
								isFocused ? "max-h-[250px]" : "max-h-[125px]"
							)}
						>
							<EditorContent
								// className={cn(!isFocused && value ? "px-3 py-2" : "")}
								editor={editor}
							/>
						</div>
					</div>

				</div>
			</RichTextProvider>
		</div>
	);
}
