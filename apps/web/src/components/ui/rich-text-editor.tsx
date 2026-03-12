import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Link } from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	CheckSquare,
	Code,
	Heading1,
	Heading2,
	Heading3,
	Highlighter,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	Palette,
	Quote,
	Redo,
	Strikethrough,
	Underline as UnderlineIcon,
	Undo,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Markdown } from "tiptap-markdown";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
	className?: string;
	id?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	value: string;
}

const COLORS = [
	"#000000",
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#06b6d4",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#6b7280",
];

function ToolbarButton({
	onClick,
	isActive,
	disabled,
	children,
	title,
}: {
	onClick: () => void;
	isActive?: boolean;
	disabled?: boolean;
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<button
			className={cn(
				"rounded p-1.5 transition-colors",
				isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
				disabled && "cursor-not-allowed opacity-50"
			)}
			disabled={disabled}
			onClick={onClick}
			onMouseDown={(e) => e.preventDefault()}
			title={title}
			type="button"
		>
			{children}
		</button>
	);
}

function ColorPicker({
	onChange,
	currentColor,
}: {
	onChange: (color: string) => void;
	currentColor?: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="relative">
			<button
				className={cn(
					"flex items-center gap-1 rounded p-1.5 transition-colors",
					"hover:bg-muted"
				)}
				onClick={() => setIsOpen(!isOpen)}
				title="Text Color"
				type="button"
			>
				<Palette className="h-4 w-4" />
				{currentColor && (
					<div
						className="h-3 w-3 rounded-full border"
						style={{ backgroundColor: currentColor }}
					/>
				)}
			</button>
			{isOpen && (
				<div className="absolute top-full left-0 z-50 mt-1 grid grid-cols-5 gap-1 rounded-lg border bg-background p-2 shadow-lg">
					{COLORS.map((color) => (
						<button
							className={cn(
								"h-6 w-6 rounded border-2 transition-transform hover:scale-110",
								currentColor === color ? "border-primary" : "border-transparent"
							)}
							key={color}
							onClick={() => {
								onChange(color);
								setIsOpen(false);
							}}
							style={{ backgroundColor: color }}
							type="button"
						/>
					))}
				</div>
			)}
		</div>
	);
}

function HighlightColorPicker({
	onChange,
	currentColor,
}: {
	onChange: (color: string) => void;
	currentColor?: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const HIGHLIGHT_COLORS = [
		"#fef08a",
		"#bbf7d0",
		"#bfdbfe",
		"#fbcfe8",
		"#fed7aa",
		"#e9d5ff",
		"#ffffff",
	];

	return (
		<div className="relative">
			<button
				className={cn(
					"flex items-center gap-1 rounded p-1.5 transition-colors",
					"hover:bg-muted"
				)}
				onClick={() => setIsOpen(!isOpen)}
				title="Highlight Color"
				type="button"
			>
				<Highlighter className="h-4 w-4" />
				{currentColor && currentColor !== "#ffffff" && (
					<div
						className="h-3 w-3 rounded-full border"
						style={{ backgroundColor: currentColor }}
					/>
				)}
			</button>
			{isOpen && (
				<div className="absolute top-full left-0 z-50 mt-1 grid grid-cols-5 gap-1 rounded-lg border bg-background p-2 shadow-lg">
					{HIGHLIGHT_COLORS.map((color) => (
						<button
							className={cn(
								"h-6 w-6 rounded border-2 transition-transform hover:scale-110",
								currentColor === color ? "border-primary" : "border-transparent"
							)}
							key={color}
							onClick={() => {
								onChange(color);
								setIsOpen(false);
							}}
							style={{ backgroundColor: color }}
							type="button"
						/>
					))}
				</div>
			)}
		</div>
	);
}

export function RichTextEditor({
	value,
	onChange,
	placeholder = "Start typing...",
	className,
	id,
}: RichTextEditorProps) {
	const [isFocused, setIsFocused] = useState(false);

	const extensions = useMemo(
		() => [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
				bulletList: {
					keepMarks: true,
					keepAttributes: false,
				},
				orderedList: {
					keepMarks: true,
					keepAttributes: false,
				},
				link: false,
				underline: false,
			}),
			Markdown,
			Placeholder.configure({
				placeholder,
			}),
			TextStyle,
			Color,
			Highlight.configure({
				multicolor: true,
			}),
			Underline,
			Typography,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-primary underline",
				},
			}),
			TaskList,
			TaskItem.configure({
				nested: true,
			}),
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
		onFocus: () => {
			setIsFocused(true);
		},
		onBlur: () => {
			setIsFocused(false);
		},
		editorProps: {
			attributes: {
				class: "max-w-none focus:outline-none px-3 py-2",
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

	const addHighlight = useCallback(
		(color: string) => {
			editor?.chain().focus().toggleHighlight({ color }).run();
		},
		[editor]
	);

	const addColor = useCallback(
		(color: string) => {
			editor?.chain().focus().setColor(color).run();
		},
		[editor]
	);

	if (!editor) {
		return null;
	}

	return (
		<div
			className={cn(
				"relative flex max-h-full flex-col rounded-md border bg-background transition-all duration-200",
				className
			)}
		>
			{isFocused && (
				<div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1">
					<ToolbarButton
						isActive={editor.isActive("bold")}
						onClick={() => editor.chain().focus().toggleBold().run()}
						title="Bold (Ctrl+B)"
					>
						<Bold className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("italic")}
						onClick={() => editor.chain().focus().toggleItalic().run()}
						title="Italic (Ctrl+I)"
					>
						<Italic className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("underline")}
						onClick={() => editor.chain().focus().toggleUnderline().run()}
						title="Underline (Ctrl+U)"
					>
						<UnderlineIcon className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("strike")}
						onClick={() => editor.chain().focus().toggleStrike().run()}
						title="Strikethrough"
					>
						<Strikethrough className="h-4 w-4" />
					</ToolbarButton>

					<div className="mx-1 h-6 w-px bg-border" />

					<ToolbarButton
						isActive={editor.isActive("heading", { level: 1 })}
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 1 }).run()
						}
						title="Heading 1"
					>
						<Heading1 className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("heading", { level: 2 })}
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 2 }).run()
						}
						title="Heading 2"
					>
						<Heading2 className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("heading", { level: 3 })}
						onClick={() =>
							editor.chain().focus().toggleHeading({ level: 3 }).run()
						}
						title="Heading 3"
					>
						<Heading3 className="h-4 w-4" />
					</ToolbarButton>

					<div className="mx-1 h-6 w-px bg-border" />

					<ToolbarButton
						isActive={editor.isActive("bulletList")}
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						title="Bullet List"
					>
						<List className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("orderedList")}
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						title="Numbered List"
					>
						<ListOrdered className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("taskList")}
						onClick={() => editor.chain().focus().toggleTaskList().run()}
						title="Task List"
					>
						<CheckSquare className="h-4 w-4" />
					</ToolbarButton>

					<div className="mx-1 h-6 w-px bg-border" />

					<ToolbarButton
						isActive={editor.isActive("blockquote")}
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						title="Quote"
					>
						<Quote className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("codeBlock")}
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
						title="Code Block"
					>
						<Code className="h-4 w-4" />
					</ToolbarButton>

					<div className="mx-1 h-6 w-px bg-border" />

					<ToolbarButton
						isActive={editor.isActive("link")}
						onClick={() => {
							const url = editor.getAttributes("link").href;
							if (url) {
								editor.chain().focus().unsetLink().run();
							} else {
								const url = window.prompt("Enter URL:");
								if (url) {
									editor
										.chain()
										.focus()
										.extendMarkRange("link")
										.setLink({ href: url })
										.run();
								}
							}
						}}
						title="Add Link"
					>
						<LinkIcon className="h-4 w-4" />
					</ToolbarButton>

					<div className="mx-1 h-6 w-px bg-border" />

					<ToolbarButton
						disabled={!editor.can().undo()}
						onClick={() => editor.chain().focus().undo().run()}
						title="Undo (Ctrl+Z)"
					>
						<Undo className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						disabled={!editor.can().redo()}
						onClick={() => editor.chain().focus().redo().run()}
						title="Redo (Ctrl+Y)"
					>
						<Redo className="h-4 w-4" />
					</ToolbarButton>
				</div>
			)}

			{editor && isFocused && (
				<BubbleMenu
					className="flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-lg"
					editor={editor}
					pluginKey={id || "bubble-menu"}
				>
					<ToolbarButton
						isActive={editor.isActive("bold")}
						onClick={() => editor.chain().focus().toggleBold().run()}
					>
						<Bold className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("italic")}
						onClick={() => editor.chain().focus().toggleItalic().run()}
					>
						<Italic className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("underline")}
						onClick={() => editor.chain().focus().toggleUnderline().run()}
					>
						<UnderlineIcon className="h-4 w-4" />
					</ToolbarButton>
					<ToolbarButton
						isActive={editor.isActive("strike")}
						onClick={() => editor.chain().focus().toggleStrike().run()}
					>
						<Strikethrough className="h-4 w-4" />
					</ToolbarButton>

					<div className="mx-1 h-5 w-px bg-border" />

					<ColorPicker
						currentColor={editor.getAttributes("textStyle").color}
						onChange={addColor}
					/>
					<HighlightColorPicker
						currentColor={editor.getAttributes("highlight").color}
						onChange={addHighlight}
					/>

					<div className="mx-1 h-5 w-px bg-border" />

					<ToolbarButton
						isActive={editor.isActive("link")}
						onClick={() => {
							const url = editor.getAttributes("link").href;
							if (url) {
								editor.chain().focus().unsetLink().run();
							} else {
								const url = window.prompt("Enter URL:");
								if (url) {
									editor
										.chain()
										.focus()
										.extendMarkRange("link")
										.setLink({ href: url })
										.run();
								}
							}
						}}
					>
						<LinkIcon className="h-4 w-4" />
					</ToolbarButton>
				</BubbleMenu>
			)}

			<div className={cn("flex-1 overflow-hidden")}>
				<div
					className={cn(
						"h-full overflow-y-auto",
						isFocused ? "max-h-[250px]" : "max-h-[125px]"
					)}
				>
					<EditorContent
						className={cn(!isFocused && value ? "px-3 py-2" : "")}
						editor={editor}
					/>
				</div>
			</div>
		</div>
	);
}
