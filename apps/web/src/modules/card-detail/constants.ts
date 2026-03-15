import z from "zod";

export const cardTypes = [
	{ value: "epic", label: "Epic", color: "#8b5cf6" },
	{ value: "feature", label: "Feature", color: "#3b82f6" },
	{ value: "user_story", label: "User Story", color: "#22c55e" },
	{ value: "bug", label: "Bug", color: "#ef4444" },
	{ value: "task", label: "Task", color: "#6b7280" },
] as const;

export const cardFormSchema = z.object({
	title: z.string().min(5, "Card title must be at least 5 characters."),
	type: z.enum(["epic", "feature", "user_story", "bug", "task"]),
	description: z.string(),
	acceptanceCriteria: z.string(),
	assigneeId: z.string().nullable(),
});
