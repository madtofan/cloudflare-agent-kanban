import {
	BoldItalicUnderlineToggles,
	CodeToggle,
	CreateLink,
	codeBlockPlugin,
	headingsPlugin,
	InsertCodeBlock,
	InsertThematicBreak,
	ListsToggle,
	linkDialogPlugin,
	linkPlugin,
	listsPlugin,
	MDXEditor,
	quotePlugin,
	Separator,
	toolbarPlugin,
	UndoRedo,
	ConditionalContents,
	markdownShortcutPlugin,
	tablePlugin,
	imagePlugin,
	codeMirrorPlugin,
	diffSourcePlugin,
	ChangeCodeMirrorLanguage,
	InsertImage,
	InsertTable,
} from "@mdxeditor/editor";
import { basicDark } from "cm6-theme-basic-dark";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";


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

	const handleFocusIn = useCallback(() => {
		setIsFocused(true);
		onFocus?.();
	}, [onFocus]);

	const handleFocusOut = useCallback(() => {
		setIsFocused(false);
		onBlur?.();
	}, [onBlur]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		container.addEventListener("focusin", handleFocusIn);
		container.addEventListener("focusout", handleFocusOut);

		container.addEventListener("pointerdown", handleFocusIn);

		return () => {
			container.removeEventListener("focusin", handleFocusIn);
			container.removeEventListener("focusout", handleFocusOut);
			container.removeEventListener("pointerdown", handleFocusIn);
		};
	}, [handleFocusIn, handleFocusOut]);

	useEffect(() => {
		if (!isFocused) {
			return;
		}

		const handleClickOutside = (e: MouseEvent) => {
			const container = containerRef.current;
			if (container && !container.contains(e.target as Node)) {
				handleFocusOut();
			}
		};

		document.addEventListener("pointerdown", handleClickOutside);
		return () =>
			document.removeEventListener("pointerdown", handleClickOutside);
	}, [isFocused, handleFocusOut]);

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
				toolbarClassName: 'p-0!',
				toolbarContents: () => isFocused ? (
					<ConditionalContents
						options={[
							{
								when: (editor) => editor?.editorType === "codeblock"
								,
								contents: () => <ChangeCodeMirrorLanguage />,
							},
							{
								fallback: () => (
									<>
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
									</>
								),
							},
						]}
					/>
				) : null,
			}),
		];
		// if (isFocused) {
		// 	pluginsToUse.push(
		// 	)
		// };

		return pluginsToUse
	}, [isFocused]);

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
				key={resolvedTheme}
				className="border-0"
				markdown={value}
				onChange={onChange}
				placeholder={placeholder}
				plugins={
					plugins
				}
				readOnly={!isFocused}
			/>
		</div>
	);
}
