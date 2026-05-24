import { callDo } from "@cloudflare-agent-kanban/api/do-client";
import type { Context } from "hono";

export async function handleSeed(c: Context): Promise<Response> {
	const db = c.env.DB as D1Database;

	const existingUser = await db
		.prepare("SELECT id FROM user WHERE id = ?")
		.bind("demo-user")
		.first();
	if (existingUser) {
		return c.json({ skipped: true, message: "Demo data already exists" });
	}

	const ts = new Date().toISOString();
	const demoUserId = "demo-user";
	const bcryptHash =
		"$2b$10$3ew2p6gHfrZOy8rFpOu2UujQ4qi5pb.0kV1BJPSMMHUbvdULKL5vK";

	await db
		.prepare(
			`INSERT INTO "user" (id, name, email, email_verified, username, display_username, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			demoUserId,
			"Demo User",
			"demo@example.com",
			1,
			"demo",
			"demo",
			ts,
			ts
		)
		.run();

	await db
		.prepare(
			`INSERT INTO "user_profile" (id, user_id, about_me, showcased_project_ids, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(
			"demo-profile",
			demoUserId,
			"I'm a full-stack developer passionate about building tools that help others showcase their work. When I'm not coding, you can find me contributing to open-source projects or writing technical blog posts.\n\nI created this platform to give developers a free way to organize their projects while building a beautiful portfolio.",
			JSON.stringify(["demo-project-1", "demo-project-2"]),
			ts,
			ts
		)
		.run();

	await db
		.prepare(
			`INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			"demo-account",
			"demo@example.com",
			"email",
			demoUserId,
			bcryptHash,
			ts,
			ts
		)
		.run();

	const projects = [
		{
			id: "demo-project-1",
			name: "E-Commerce Platform",
			description:
				"A full-featured e-commerce solution built with React, Node.js, and PostgreSQL. Features include user authentication, shopping cart, payment processing, and an admin dashboard.",
			visibility: "public",
			boards: [
				{
					id: "demo-board-1",
					name: "Main Board",
					description: "Main development board for the e-commerce platform",
					visibility: "public",
					columns: [
						{ id: "demo-col-1-1", name: "To Do", position: 0 },
						{ id: "demo-col-1-2", name: "In Progress", position: 1 },
						{ id: "demo-col-1-3", name: "Done", position: 2 },
					],
					cards: [
						{
							colId: "demo-col-1-1",
							title: "Set up project repository",
							type: "task",
						},
						{
							colId: "demo-col-1-1",
							title: "Design database schema",
							type: "epic",
						},
						{
							colId: "demo-col-1-1",
							title: "Create user authentication",
							type: "feature",
						},
						{
							colId: "demo-col-1-2",
							title: "Build product catalog API",
							type: "feature",
						},
						{
							colId: "demo-col-1-2",
							title: "Implement shopping cart",
							type: "feature",
						},
						{
							colId: "demo-col-1-3",
							title: "Setup CI/CD pipeline",
							type: "task",
						},
						{
							colId: "demo-col-1-3",
							title: "Configure domain and SSL",
							type: "task",
						},
					],
				},
			],
		},
		{
			id: "demo-project-2",
			name: "Task Management API",
			description:
				"A RESTful API for task management with authentication, team collaboration, and real-time updates using WebSockets.",
			visibility: "public",
			boards: [
				{
					id: "demo-board-2",
					name: "Development",
					description: "Development board for the Task Management API",
					visibility: "public",
					columns: [
						{ id: "demo-col-2-1", name: "Backlog", position: 0 },
						{ id: "demo-col-2-2", name: "Active", position: 1 },
						{ id: "demo-col-2-3", name: "Complete", position: 2 },
					],
					cards: [
						{
							colId: "demo-col-2-1",
							title: "Design API endpoints",
							type: "epic",
						},
						{
							colId: "demo-col-2-1",
							title: "Setup authentication middleware",
							type: "feature",
						},
						{
							colId: "demo-col-2-1",
							title: "Implement WebSocket handlers",
							type: "feature",
						},
						{
							colId: "demo-col-2-2",
							title: "Create user model",
							type: "task",
						},
						{
							colId: "demo-col-2-2",
							title: "Build task CRUD operations",
							type: "feature",
						},
						{
							colId: "demo-col-2-3",
							title: "Write API documentation",
							type: "task",
						},
						{
							colId: "demo-col-2-3",
							title: "Setup Docker configuration",
							type: "task",
						},
					],
				},
			],
		},
	];

	let boardsCreated = 0;
	let columnsCreated = 0;
	let cardsCreated = 0;

	for (const project of projects) {
		await db
			.prepare(
				`INSERT INTO "project" (id, name, description, visibility, owner_id, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				project.id,
				project.name,
				project.description,
				project.visibility,
				demoUserId,
				ts,
				ts
			)
			.run();

		await db
			.prepare(
				`INSERT INTO "project_member" (id, project_id, user_id, role, created_at)
				 VALUES (?, ?, ?, ?, ?)`
			)
			.bind(`${project.id}-member`, project.id, demoUserId, "admin", ts)
			.run();

		for (const board of project.boards) {
			await callDo(c.env, project.id, "createBoard", {
				boardId: board.id,
				name: board.name,
				description: board.description,
				visibility: board.visibility,
				ownerId: demoUserId,
			});
			boardsCreated++;

			for (const col of board.columns) {
				await callDo(c.env, project.id, "createColumn", {
					boardId: board.id,
					columnId: col.id,
					name: col.name,
					userId: demoUserId,
				});
				columnsCreated++;
			}

			for (const card of board.cards) {
				const prefixedColId = `${project.id}:${card.colId}`;
				await callDo(c.env, project.id, "createCard", {
					columnId: prefixedColId,
					userId: demoUserId,
					title: card.title,
					type: card.type,
				});
				cardsCreated++;
			}
		}
	}

	return c.json({
		success: true,
		details: {
			boards: boardsCreated,
			columns: columnsCreated,
			cards: cardsCreated,
		},
	});
}
