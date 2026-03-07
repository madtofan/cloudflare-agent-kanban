export function formatDate(date: Date | string | null | undefined): string {
	if (!date) {
		return "Unknown";
	}
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(d);
}

export function getActionLabel(action: string): string {
	switch (action) {
		case "CREATE":
			return "Created";
		case "UPDATE":
			return "Updated";
		case "DELETE":
			return "Deleted";
		case "MOVE":
			return "Moved";
		default:
			return action;
	}
}
