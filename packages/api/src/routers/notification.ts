import { db } from "@cloudflare-agent-kanban/db";
import { notification } from "@cloudflare-agent-kanban/db/schema/auth";
import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure } from "../index";

export const notificationRouter = {
	getAll: protectedProcedure
		.route({
			method: "GET",
			path: "/api/notifications",
			summary: "",
			tags: ["Notifications"],
		})
		.input(
			z.object({
				limit: z.number().min(1).max(50).default(20),
				cursor: z.string().optional(),
			})
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const { limit, cursor } = input;

			const notifications = await db.query.notification.findMany({
				where: and(
					eq(notification.userId, userId),
					cursor
						? sql`${notification.createdAt} < ${new Date(Number.parseInt(cursor, 10))}`
						: undefined
				),
				orderBy: desc(notification.createdAt),
				limit: limit + 1,
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							username: true,
							image: true,
						},
					},
				},
			});

			let nextCursor: string | undefined;
			if (notifications.length > limit) {
				const nextItem = notifications.pop();
				nextCursor = nextItem?.createdAt.getTime().toString();
			}

			return {
				notifications,
				nextCursor,
			};
		}),

	getUnreadCount: protectedProcedure
		.route({
			method: "GET",
			path: "/api/notifications/unread/count",
			summary: "",
			tags: ["Notifications"],
		})
		.handler(async ({ context }) => {
			const userId = context.session.user.id;

			const result = await db
				.select({ count: sql<number>`count(*)` })
				.from(notification)
				.where(
					and(eq(notification.userId, userId), eq(notification.read, false))
				);

			return result[0]?.count || 0;
		}),

	markAsRead: protectedProcedure
		.route({
			method: "GET",
			path: "/api/notifications/mark-read/{id}",
			summary: "",
			tags: ["Notifications"],
		})
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			await db
				.update(notification)
				.set({ read: true })
				.where(
					and(eq(notification.id, input.id), eq(notification.userId, userId))
				);

			return { success: true };
		}),

	markAllAsRead: protectedProcedure
		.route({
			method: "GET",
			path: "/api/notifications/mark-all-read",
			summary: "",
			tags: ["Notifications"],
		})
		.handler(async ({ context }) => {
			const userId = context.session.user.id;

			await db
				.update(notification)
				.set({ read: true })
				.where(eq(notification.userId, userId));

			return { success: true };
		}),
};
