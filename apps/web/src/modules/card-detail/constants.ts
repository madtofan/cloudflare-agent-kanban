import { Bug, CheckSquare, Layers, Sparkles, User } from "lucide-react";
import z from "zod";

export const cardTypes = [
	{ value: "epic", label: "Epic", color: "#8b5cf6", icon: Layers },
	{ value: "feature", label: "Feature", color: "#3b82f6", icon: Sparkles },
	{ value: "user_story", label: "User Story", color: "#22c55e", icon: User },
	{ value: "bug", label: "Bug", color: "#ef4444", icon: Bug },
	{ value: "task", label: "Task", color: "#6b7280", icon: CheckSquare },
] as const;

export const cardFormSchema = z.object({
	title: z.string().min(5, "Card title must be at least 5 characters."),
	type: z.enum(["epic", "feature", "user_story", "bug", "task"]),
	description: z.string(),
	acceptanceCriteria: z.string(),
	assigneeId: z.string().nullable(),
});
