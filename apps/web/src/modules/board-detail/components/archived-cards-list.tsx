import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { orpc } from "@/utils/orpc";

interface ArchivedCard {
	archivedDate: Date | null;
	cardNumber: number;
	id: string;
	originalColumnName: string;
	title: string;
}

interface ArchivedCardsListProps {
	boardId: string;
}

export function ArchivedCardsList({ boardId }: ArchivedCardsListProps) {
	const queryClient = useQueryClient();
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
	const [columnFilter, setColumnFilter] = useState<string>("");
	const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
	const [showColumnDropdown, setShowColumnDropdown] = useState(false);
	const [showDateDropdown, setShowDateDropdown] = useState(false);

	const archivedCards = useQuery(
		orpc.card.getArchivedByBoardId.queryOptions({ input: { boardId } })
	);

	const formatDate = useCallback((date: Date | null | undefined) => {
		if (!date) {
			return "Unknown";
		}
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}, []);

	const unarchiveMutation = useMutation(
		orpc.card.unarchive.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries({
					queryKey: orpc.card.getByBoardId.queryKey({ input: { boardId } }),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.card.getArchivedByBoardId.queryKey({
						input: { boardId },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.card.getArchivedCount.queryKey({
						input: { boardId },
					}),
				});
				setRowSelection({});
				toast.success(`${data.unarchivedCount} cards unarchived`);
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const uniqueColumns = useMemo(
		() =>
			Array.from(
				new Set(archivedCards.data?.map((c) => c.originalColumnName) ?? [])
			).sort(),
		[archivedCards.data]
	);

	const columns: ColumnDef<ArchivedCard>[] = useMemo(
		() => [
			{
				id: "select",
				header: ({ table: currentTable }) => (
					<Checkbox
						checked={currentTable.getIsAllPageRowsSelected()}
						onCheckedChange={(value) =>
							currentTable.toggleAllPageRowsSelected(!!value)
						}
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
					/>
				),
				enableSorting: false,
			},
			{
				accessorKey: "cardNumber",
				header: "Card",
				cell: ({ row }) => (
					<span>
						<span className="font-mono text-muted-foreground">
							{row.original.cardNumber}
						</span>{" "}
						{row.original.title}
					</span>
				),
			},
			{
				accessorKey: "originalColumnName",
				header: "Original Column",
				cell: ({ row }) => row.original.originalColumnName,
				filterFn: (row, _columnId, filterValue) => {
					if (!filterValue) {
						return true;
					}
					return row.original.originalColumnName === filterValue;
				},
			},
			{
				accessorKey: "archivedDate",
				header: "Archived Date",
				cell: ({ row }) => formatDate(row.original.archivedDate),
				filterFn: (row, _columnId, filterValue) => {
					if (!filterValue) {
						return true;
					}
					const cardDateValue = row.original.archivedDate;
					if (!cardDateValue) {
						return false;
					}
					const cardDate = new Date(cardDateValue);
					if (Number.isNaN(cardDate.getTime())) {
						return false;
					}
					const filterDate = new Date(filterValue);
					return (
						cardDate.getFullYear() === filterDate.getFullYear() &&
						cardDate.getMonth() === filterDate.getMonth() &&
						cardDate.getDate() === filterDate.getDate()
					);
				},
			},
		],
		[formatDate]
	);

	const columnFilters = useMemo(
		() => [
			...(columnFilter
				? [{ id: "originalColumnName", value: columnFilter }]
				: []),
			...(dateFilter ? [{ id: "archivedDate", value: dateFilter }] : []),
		],
		[columnFilter, dateFilter]
	);

	const table = useReactTable({
		data: archivedCards.data ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getRowId: (row) => row.id,
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
			columnFilters,
		},
	});

	const handleUnarchiveSelected = () => {
		const selectedIds = Object.keys(rowSelection);
		if (selectedIds.length === 0) {
			toast.error("No cards selected");
			return;
		}
		unarchiveMutation.mutate({ cardIds: selectedIds });
	};

	const clearColumnFilter = () => setColumnFilter("");
	const clearDateFilter = () => setDateFilter(undefined);

	if (archivedCards.isLoading) {
		return <div>Loading archived cards...</div>;
	}

	if (archivedCards.isError) {
		return <div>Error loading archived cards</div>;
	}

	if (archivedCards.data?.length === 0) {
		return (
			<div className="flex h-64 items-center justify-center text-muted-foreground">
				No archived cards
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-4">
				<Button
					disabled={
						Object.keys(rowSelection).length === 0 ||
						unarchiveMutation.isPending
					}
					onClick={handleUnarchiveSelected}
				>
					Unarchive Selected ({Object.keys(rowSelection).length})
				</Button>
				<div className="relative">
					<Button
						className="w-[180px] justify-between"
						onClick={() => {
							setShowColumnDropdown(!showColumnDropdown);
							setShowDateDropdown(false);
						}}
						type="button"
						variant="outline"
					>
						{columnFilter || "Filter by Column"}
						<svg
							className="ml-2 h-4 w-4 opacity-50"
							fill="none"
							height="24"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</Button>
					{showColumnDropdown && (
						<div className="absolute z-50 mt-1 w-[200px] rounded-md border bg-popover p-2 shadow-md">
							<Button
								className="w-full justify-start"
								onClick={() => {
									clearColumnFilter();
									setShowColumnDropdown(false);
								}}
								size="sm"
								variant={columnFilter === "" ? "secondary" : "ghost"}
							>
								All Columns
							</Button>
							{uniqueColumns.map((col) => (
								<Button
									className="w-full justify-start"
									key={col}
									onClick={() => {
										setColumnFilter(col);
										setShowColumnDropdown(false);
									}}
									size="sm"
									variant={columnFilter === col ? "secondary" : "ghost"}
								>
									{col}
								</Button>
							))}
						</div>
					)}
				</div>
				{columnFilter && (
					<Button
						className="h-8 w-8"
						onClick={clearColumnFilter}
						size="icon"
						type="button"
						variant="ghost"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							height="24"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
						>
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
					</Button>
				)}
				<div className="relative">
					<Button
						className="w-[200px] justify-between"
						onClick={() => {
							setShowDateDropdown(!showDateDropdown);
							setShowColumnDropdown(false);
						}}
						type="button"
						variant="outline"
					>
						{dateFilter
							? formatDate(dateFilter).split(" ")[0] +
								" " +
								formatDate(dateFilter).split(" ").slice(1, 3).join(" ")
							: "Filter by Date"}
						<svg
							className="ml-2 h-4 w-4 opacity-50"
							fill="none"
							height="24"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</Button>
					{showDateDropdown && (
						<div className="absolute z-50 mt-1 rounded-md border bg-popover p-2 shadow-md">
							<Button
								className="w-full justify-start"
								onClick={() => {
									clearDateFilter();
									setShowDateDropdown(false);
								}}
								size="sm"
								type="button"
								variant={dateFilter ? "ghost" : "secondary"}
							>
								All Dates
							</Button>
							<Calendar
								mode="single"
								onSelect={(date) => {
									setDateFilter(date);
									setShowDateDropdown(false);
								}}
								selected={dateFilter}
							/>
						</div>
					)}
				</div>
				{dateFilter && (
					<Button
						className="h-8 w-8"
						onClick={clearDateFilter}
						size="icon"
						type="button"
						variant="ghost"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							height="24"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
						>
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
					</Button>
				)}
			</div>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								data-state={row.getIsSelected() && "selected"}
								key={row.id}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell className="h-24 text-center" colSpan={columns.length}>
								No archived cards
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
