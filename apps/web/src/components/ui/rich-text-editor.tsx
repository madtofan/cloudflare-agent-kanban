import {
	BoldItalicUnderlineToggles,
	ChangeCodeMirrorLanguage,
	CodeToggle,
	ConditionalContents,
	CreateLink,
	codeBlockPlugin,
	codeMirrorPlugin,
	diffSourcePlugin,
	headingsPlugin,
	InsertCodeBlock,
	InsertImage,
	InsertTable,
	InsertThematicBreak,
	imagePlugin,
	ListsToggle,
	linkDialogPlugin,
	linkPlugin,
	listsPlugin,
	MDXEditor,
	markdownShortcutPlugin,
	quotePlugin,
	Separator,
	tablePlugin,
	toolbarPlugin,
	UndoRedo,
} from "@mdxeditor/editor";
import { basicDark } from "cm6-theme-basic-dark";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
	className?: string;
	onBlur?: () => void;
	onChange: (value: string) => void;
	onFocus?: () => void;
	placeholder?: string;
	value: string;
}

export function RichTextEditor({
	className,
	onBlur,
	onChange,
	onFocus,
	placeholder,
	value,
}: RichTextEditorProps) {
	const { resolvedTheme } = useTheme();
	const themeExtension = resolvedTheme === "dark" ? [basicDark] : [];
	const [isFocused, setIsFocused] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const handlePointerDown = () => {
			setIsFocused(true);
			onFocus?.();
		};

		const handleFocusIn = (event: Event) => {
			if (
				"relatedTarget" in event &&
				container.contains(event.relatedTarget as Node)
			) {
				handlePointerDown();
			}
		};

		const handleFocusOut = (event: Event) => {
			if (
				"relatedTarget" in event &&
				!container.contains(event.relatedTarget as Node)
			) {
				setIsFocused(false);
				onBlur?.();
			}
		};

		container.addEventListener("focusin", handleFocusIn);
		container.addEventListener("focusout", handleFocusOut);
		container.addEventListener("pointerdown", handlePointerDown);
		return () => {
			container.removeEventListener("focusin", handleFocusIn);
			container.removeEventListener("focusout", handleFocusOut);
			container.removeEventListener("pointerdown", handlePointerDown);
		};
	}, [onFocus, onBlur]);

	const plugins = useMemo(() => {
		const pluginsToUse = [
			headingsPlugin(),
			listsPlugin(),
			linkPlugin(),
			linkDialogPlugin(),
			quotePlugin(),
			markdownShortcutPlugin(),
			tablePlugin(),
			imagePlugin(),
			codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
			codeMirrorPlugin({
				codeBlockLanguages: {
					css: "css",
					txt: "txt",
					sql: "sql",
					html: "html",
					sass: "sass",
					scss: "scss",
					bash: "bash",
					json: "json",
					js: "javascript",
					ts: "typescript",
					"": "unspecified",
					tsx: "TypeScript (React)",
					jsx: "JavaScript (React)",
				},
				autoLoadLanguageSupport: true,
				codeMirrorExtensions: themeExtension,
			}),
			diffSourcePlugin({ viewMode: "rich-text", diffMarkdown: "" }),
			toolbarPlugin({
				toolbarClassName: "p-0!",
				toolbarContents: () =>
					isFocused ? (
						<ConditionalContents
							options={[
								{
									when: (editor) => editor?.editorType === "codeblock",
									contents: () => <ChangeCodeMirrorLanguage />,
								},
								{
									fallback: () => (
										<div className="flex flex-row">
											<UndoRedo />
											<Separator />
											<BoldItalicUnderlineToggles />
											<CodeToggle />
											<Separator />
											<ListsToggle />
											<Separator />
											<CreateLink />
											<InsertImage />
											<Separator />
											<InsertTable />
											<InsertThematicBreak />
											<Separator />
											<InsertCodeBlock />
										</div>
									),
								},
							]}
						/>
					) : null,
			}),
		];

		return pluginsToUse;
	}, [isFocused, themeExtension]);

	return (
		<div
			className={cn(
				"prose prose-sm dark:prose-invert max-w-none border-b",
				isFocused && "ring-2 ring-ring ring-offset-2 ring-offset-background",
				className
			)}
			ref={containerRef}
			role="textbox"
		>
			<MDXEditor
				className="border-0"
				key={resolvedTheme}
				markdown={value}
				onChange={onChange}
				placeholder={placeholder}
				plugins={plugins}
				readOnly={!isFocused}
			/>
		</div>
	);
}
