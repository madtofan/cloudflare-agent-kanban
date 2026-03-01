import type { Props } from "react-select";
import Select, { type SingleValue } from "react-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface ReactSelectOption {
	avatarUrl?: string | null;
	label: string;
	name: string;
	value: string;
}

interface ReactSelectProps
	extends Omit<Props<ReactSelectOption>, "value" | "onChange" | "isMulti"> {
	onChange: (value: string | null) => void;
	value: string | null;
}

export function ReactSelect({
	value,
	onChange,
	className,
	placeholder = "Select...",
	options,
	...props
}: ReactSelectProps) {
	const flatOptions =
		options?.flatMap((opt) => ("options" in opt ? opt.options : opt)) ?? [];

	const selectedOption = value
		? flatOptions.find((opt) => opt.value === value)
		: null;

	const handleChange = (newValue: SingleValue<ReactSelectOption> | null) => {
		onChange(newValue?.value ?? null);
	};

	return (
		<Select<ReactSelectOption, false>
			className={cn("react-select-container", className)}
			classNamePrefix="react-select"
			isClearable
			menuPortalTarget={typeof document !== "undefined" ? document.body : null}
			onChange={handleChange}
			options={options}
			placeholder={placeholder}
			styles={{
				control: (base, state) => ({
					...base,
					minHeight: "2rem",
					height: "2rem",
					padding: "0 0.5rem",
					fontSize: "0.75rem",
					borderColor: "var(--input)",
					backgroundColor: "transparent",
					borderRadius: 0,
					boxShadow: state.isFocused ? "0 0 0 1px var(--ring)" : "none",
					"&:hover": {
						borderColor: "var(--input)",
					},
				}),
				valueContainer: (base) => ({
					...base,
					padding: "0",
					gap: "0.375rem",
				}),
				indicatorSeparator: () => ({
					display: "none",
				}),
				dropdownIndicator: (base) => ({
					...base,
					padding: "0",
					color: "var(--muted-foreground)",
				}),
				clearIndicator: (base) => ({
					...base,
					padding: "0",
					color: "var(--muted-foreground)",
					cursor: "pointer",
					"&:hover": {
						color: "var(--foreground)",
					},
				}),
				input: (base) => ({
					...base,
					margin: "0",
					padding: "0",
				}),
				singleValue: (base) => ({
					...base,
					margin: "0",
					gap: "0.375rem",
					color: "var(--foreground)",
				}),
				placeholder: (base) => ({
					...base,
					margin: "0",
					color: "var(--muted-foreground)",
				}),
				menu: (base) => ({
					...base,
					backgroundColor: "var(--popover)",
					color: "var(--popover-foreground)",
					borderRadius: "var(--radius-md)",
					boxShadow:
						"0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
					border: "1px solid var(--border)",
					overflow: "hidden",
					marginTop: "0.25rem",
					zIndex: 9999,
				}),
				menuPortal: (base) => ({
					...base,
					zIndex: 9999,
					pointerEvents: "auto",
				}),
				menuList: (base) => ({
					...base,
					padding: "0.25rem",
				}),
				option: (base, state) => ({
					...base,
					fontSize: "0.75rem",
					padding: "0.5rem 0.625rem",
					borderRadius: "var(--radius-sm)",
					backgroundColor: state.isSelected
						? "var(--accent)"
						: state.isFocused
							? "var(--accent)"
							: "transparent",
					color: state.isSelected
						? "var(--accent-foreground)"
						: "var(--foreground)",
					cursor: "pointer",
					"&:active": {
						backgroundColor: "var(--accent)",
					},
				}),
				noOptionsMessage: (base) => ({
					...base,
					fontSize: "0.75rem",
					color: "var(--muted-foreground)",
				}),
			}}
			value={selectedOption ?? null}
			{...props}
		/>
	);
}

export function ReactSelectWithAvatar({
	value,
	onChange,
	options,
	...props
}: Omit<ReactSelectProps, "formatOptionLabel">) {
	return (
		<ReactSelect
			formatOptionLabel={(option: ReactSelectOption) => (
				<div className="flex items-center gap-2">
					<Avatar className="size-6">
						<AvatarImage src={option.avatarUrl ?? undefined} />
						<AvatarFallback>
							{option.name?.[0]?.toUpperCase() ?? "?"}
						</AvatarFallback>
					</Avatar>
					<span>{option.label}</span>
				</div>
			)}
			menuPortalTarget={typeof document !== "undefined" ? document.body : null}
			onChange={onChange}
			options={options}
			value={value}
			{...props}
		/>
	);
}
