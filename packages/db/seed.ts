import dotenv from "dotenv";

const result = dotenv.config({
	path:
		process.env.NODE_ENV === "production"
			? "../../apps/server/.env.prod"
			: "../../apps/server/.env",
});

if (result.error) {
	console.warn("Failed to load .env file:", result.error.message);
}

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// biome-ignore lint/performance/noNamespaceImport: We really want to import all of the schema
import * as schema from "./src/schema";

let dbPath: string;

if (process.env.LOCAL_DB_PATH) {
	dbPath = process.env.LOCAL_DB_PATH;
} else if (process.env.NODE_ENV === "production") {
	throw new Error(
		"Production seeding requires DB remote configuration. Use db:seed:prod command."
	);
} else {
	throw new Error("LOCAL_DB_PATH not set. Use pnpm run db:seed:local");
}

console.log("📂 Using database:", dbPath);

const client = createClient({
	url: `file:${dbPath}`,
});

const db = drizzle(client, { schema });

import { user, userProfile } from "@cloudflare-agent-kanban/db/schema/auth";
import {
	board,
	card,
	column,
	project,
	projectMember,
} from "@cloudflare-agent-kanban/db/schema/kanban";
import { eq } from "drizzle-orm";

const DEMO_USER_ID = "demo-user";
const DEMO_PROJECT_1_ID = "demo-project-1";
const DEMO_PROJECT_2_ID = "demo-project-2";
const DEMO_BOARD_1_ID = "demo-board-1";
const DEMO_BOARD_2_ID = "demo-board-2";

async function seed() {
	console.log("🌱 Starting demo data seed...");

	const existingUser = await db.query.user.findFirst({
		where: eq(user.id, DEMO_USER_ID),
	});

	if (existingUser) {
		console.log("Demo user already exists, skipping seed.");
		return;
	}

	console.log("Creating demo user...");
	await db.insert(user).values({
		id: DEMO_USER_ID,
		name: "Demo User",
		email: "demo@example.com",
		emailVerified: true,
		username: "demo",
		displayUsername: "demo",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	console.log("Creating demo user profile...");
	await db.insert(userProfile).values({
		id: "demo-profile",
		userId: DEMO_USER_ID,
		aboutMe:
			"<p>I'm a full-stack developer passionate about building tools that help others showcase their work. When I'm not coding, you can find me contributing to open-source projects or writing technical blog posts.</p><p>I created this platform to give developers a free way to organize their projects while building a beautiful portfolio.</p>",
		showcasedProjectIds: JSON.stringify([DEMO_PROJECT_1_ID, DEMO_PROJECT_2_ID]),
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	console.log("Creating demo project 1: E-Commerce Platform...");
	await db.insert(project).values({
		id: DEMO_PROJECT_1_ID,
		name: "E-Commerce Platform",
		description:
			"A full-featured e-commerce solution built with React, Node.js, and PostgreSQL. Features include user authentication, shopping cart, payment processing, and an admin dashboard.",
		visibility: "public",
		ownerId: DEMO_USER_ID,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	await db.insert(projectMember).values({
		id: "demo-project-1-member",
		projectId: DEMO_PROJECT_1_ID,
		userId: DEMO_USER_ID,
		role: "admin",
		createdAt: new Date(),
	});

	console.log("Creating demo board 1: Main Board...");
	await db.insert(board).values({
		id: DEMO_BOARD_1_ID,
		name: "Main Board",
		description: "Main development board for the e-commerce platform",
		visibility: "public",
		ownerId: DEMO_USER_ID,
		projectId: DEMO_PROJECT_1_ID,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	console.log("Creating columns for board 1...");
	const columns1 = [
		{ id: "demo-col-1-1", name: "To Do", position: 0 },
		{ id: "demo-col-1-2", name: "In Progress", position: 1 },
		{ id: "demo-col-1-3", name: "Done", position: 2 },
	];

	for (const col of columns1) {
		await db.insert(column).values({
			id: col.id,
			boardId: DEMO_BOARD_1_ID,
			name: col.name,
			position: col.position,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	console.log("Creating cards for board 1...");
	const cards1 = [
		{
			colId: "demo-col-1-1",
			title: "Set up project repository",
			type: "task",
			pos: 0,
		},
		{
			colId: "demo-col-1-1",
			title: "Design database schema",
			type: "epic",
			pos: 1,
		},
		{
			colId: "demo-col-1-1",
			title: "Create user authentication",
			type: "feature",
			pos: 2,
		},
		{
			colId: "demo-col-1-2",
			title: "Build product catalog API",
			type: "feature",
			pos: 0,
		},
		{
			colId: "demo-col-1-2",
			title: "Implement shopping cart",
			type: "feature",
			pos: 1,
		},
		{
			colId: "demo-col-1-3",
			title: "Setup CI/CD pipeline",
			type: "task",
			pos: 0,
		},
		{
			colId: "demo-col-1-3",
			title: "Configure domain and SSL",
			type: "task",
			pos: 1,
		},
	];

	for (let i = 0; i < cards1.length; i++) {
		const c = cards1[i];
		await db.insert(card).values({
			id: `demo-card-1-${i + 1}`,
			boardId: DEMO_BOARD_1_ID,
			cardNumber: i + 1,
			columnId: c.colId,
			title: c.title,
			type: c.type as "task" | "epic" | "feature",
			description: null,
			acceptanceCriteria: null,
			position: c.pos,
			assigneeId: null,
			agentTriggerUrl: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	console.log("Creating demo project 2: Task Management API...");
	await db.insert(project).values({
		id: DEMO_PROJECT_2_ID,
		name: "Task Management API",
		description:
			"A RESTful API for task management with authentication, team collaboration, and real-time updates using WebSockets.",
		visibility: "public",
		ownerId: DEMO_USER_ID,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	await db.insert(projectMember).values({
		id: "demo-project-2-member",
		projectId: DEMO_PROJECT_2_ID,
		userId: DEMO_USER_ID,
		role: "admin",
		createdAt: new Date(),
	});

	console.log("Creating demo board 2: Development...");
	await db.insert(board).values({
		id: DEMO_BOARD_2_ID,
		name: "Development",
		description: "Development board for the Task Management API",
		visibility: "public",
		ownerId: DEMO_USER_ID,
		projectId: DEMO_PROJECT_2_ID,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	console.log("Creating columns for board 2...");
	const columns2 = [
		{ id: "demo-col-2-1", name: "Backlog", position: 0 },
		{ id: "demo-col-2-2", name: "Active", position: 1 },
		{ id: "demo-col-2-3", name: "Complete", position: 2 },
	];

	for (const col of columns2) {
		await db.insert(column).values({
			id: col.id,
			boardId: DEMO_BOARD_2_ID,
			name: col.name,
			position: col.position,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	console.log("Creating cards for board 2...");
	const cards2 = [
		{
			colId: "demo-col-2-1",
			title: "Design API endpoints",
			type: "epic",
			pos: 0,
		},
		{
			colId: "demo-col-2-1",
			title: "Setup authentication middleware",
			type: "feature",
			pos: 1,
		},
		{
			colId: "demo-col-2-1",
			title: "Implement WebSocket handlers",
			type: "feature",
			pos: 2,
		},
		{ colId: "demo-col-2-2", title: "Create user model", type: "task", pos: 0 },
		{
			colId: "demo-col-2-2",
			title: "Build task CRUD operations",
			type: "feature",
			pos: 1,
		},
		{
			colId: "demo-col-2-3",
			title: "Write API documentation",
			type: "task",
			pos: 0,
		},
		{
			colId: "demo-col-2-3",
			title: "Setup Docker configuration",
			type: "task",
			pos: 1,
		},
	];

	for (let i = 0; i < cards2.length; i++) {
		const c = cards2[i];
		await db.insert(card).values({
			id: `demo-card-2-${i + 1}`,
			boardId: DEMO_BOARD_2_ID,
			cardNumber: i + 1,
			columnId: c.colId,
			title: c.title,
			type: c.type as "task" | "epic" | "feature",
			description: null,
			acceptanceCriteria: null,
			position: c.pos,
			assigneeId: null,
			agentTriggerUrl: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	console.log("✅ Demo data seeded successfully!");
	console.log("   - Demo user: /profile/demo");
	console.log(`   - Project 1: /projects/${DEMO_PROJECT_1_ID}`);
	console.log(`   - Project 2: /projects/${DEMO_PROJECT_2_ID}`);
}

seed()
	.then(() => {
		console.log("Seed completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exit(1);
	});
