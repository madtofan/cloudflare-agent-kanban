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

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const localDbPath = process.env.LOCAL_DB_PATH;

if (!(localDbPath || (accountId && databaseId && token))) {
	throw new Error(
		"Missing required environment variables. Use LOCAL_DB_PATH for local or CLOUDFLARE_* for production."
	);
}

const D1_API_URL =
	localDbPath === undefined
		? `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`
		: "";

interface D1Result {
	results?: unknown[];
	success: boolean;
	meta: unknown[];
}

interface D1Response {
	errors?: unknown[];
	result?: D1Result[];
	success: boolean;
}

async function d1Execute(sql: string, params: unknown[] = []) {
	if (localDbPath !== undefined) {
		throw new Error(
			"Local DB seeding not implemented. Use db:seed:local with LOCAL_DB_PATH."
		);
	}

	const response = await fetch(`${D1_API_URL}/query`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			sql,
			params,
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`D1 API error: ${response.status} ${error}`);
	}

	const data = (await response.json()) as D1Response;
	if (!data.success) {
		throw new Error(`D1 query failed: ${JSON.stringify(data.errors)}`);
	}
	return data;
}

async function d1Query(sql: string, params: unknown[] = []) {
	if (localDbPath !== undefined) {
		throw new Error(
			"Local DB seeding not implemented. Use db:seed:local with LOCAL_DB_PATH."
		);
	}

	const response = await fetch(`${D1_API_URL}/query`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			sql,
			params,
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`D1 API error: ${response.status} ${error}`);
	}

	const data = (await response.json()) as D1Response;
	if (!data.success) {
		throw new Error(`D1 query failed: ${JSON.stringify(data.errors)}`);
	}
	return data.result ?? [];
}

const DEMO_USER_ID = "demo-user";
const DEMO_PROJECT_1_ID = "demo-project-1";
const DEMO_PROJECT_2_ID = "demo-project-2";
const DEMO_BOARD_1_ID = "demo-board-1";
const DEMO_BOARD_2_ID = "demo-board-2";

async function seed() {
	console.log("🌱 Starting demo data seed...");
	console.log("📂 Using database: D1 Remote");

	const existingUsers = (await d1Query("SELECT id FROM user WHERE id = ?", [
		DEMO_USER_ID,
	])).find(Boolean);

	if (existingUsers?.results?.length ?? 0 > 0) {
		console.log("Demo user already exists, skipping seed.");
		return;
	}

	console.log("Creating demo user...");
	await d1Execute(
		`INSERT INTO "user" (id, name, email, email_verified, username, display_username, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			DEMO_USER_ID,
			"Demo User",
			"demo@example.com",
			1,
			"demo",
			"demo",
			new Date().toISOString(),
			new Date().toISOString(),
		]
	);

	console.log("Creating demo user profile...");
	await d1Execute(
		`INSERT INTO "user_profile" (id, user_id, about_me, showcased_project_ids, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		[
			"demo-profile",
			DEMO_USER_ID,
			"<p>I'm a full-stack developer passionate about building tools that help others showcase their work. When I'm not coding, you can find me contributing to open-source projects or writing technical blog posts.</p><p>I created this platform to give developers a free way to organize their projects while building a beautiful portfolio.</p>",
			JSON.stringify([DEMO_PROJECT_1_ID, DEMO_PROJECT_2_ID]),
			new Date().toISOString(),
			new Date().toISOString(),
		]
	);

	console.log("Creating demo project 1: E-Commerce Platform...");
	await d1Execute(
		`INSERT INTO "project" (id, name, description, visibility, owner_id, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			DEMO_PROJECT_1_ID,
			"E-Commerce Platform",
			"A full-featured e-commerce solution built with React, Node.js, and PostgreSQL. Features include user authentication, shopping cart, payment processing, and an admin dashboard.",
			"public",
			DEMO_USER_ID,
			new Date().toISOString(),
			new Date().toISOString(),
		]
	);

	await d1Execute(
		`INSERT INTO "project_member" (id, project_id, user_id, role, created_at)
		 VALUES (?, ?, ?, ?, ?)`,
		[
			"demo-project-1-member",
			DEMO_PROJECT_1_ID,
			DEMO_USER_ID,
			"admin",
			new Date().toISOString(),
		]
	);

	console.log("Creating demo board 1: Main Board...");
	await d1Execute(
		`INSERT INTO "board" (id, name, description, visibility, owner_id, project_id, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			DEMO_BOARD_1_ID,
			"Main Board",
			"Main development board for the e-commerce platform",
			"public",
			DEMO_USER_ID,
			DEMO_PROJECT_1_ID,
			new Date().toISOString(),
			new Date().toISOString(),
		]
	);

	console.log("Creating columns for board 1...");
	const columns1 = [
		{ id: "demo-col-1-1", name: "To Do", position: 0 },
		{ id: "demo-col-1-2", name: "In Progress", position: 1 },
		{ id: "demo-col-1-3", name: "Done", position: 2 },
	];

	for (const col of columns1) {
		await d1Execute(
			`INSERT INTO "column" (id, board_id, name, position, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[
				col.id,
				DEMO_BOARD_1_ID,
				col.name,
				col.position,
				new Date().toISOString(),
				new Date().toISOString(),
			]
		);
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
		if (c === undefined) {
			continue;
		}
		await d1Execute(
			`INSERT INTO "card" (id, board_id, card_number, column_id, title, type, description, acceptance_criteria, position, assignee_id, agent_trigger_url, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				`demo-card-1-${i + 1}`,
				DEMO_BOARD_1_ID,
				i + 1,
				c.colId,
				c.title,
				c.type,
				null,
				null,
				c.pos,
				null,
				null,
				new Date().toISOString(),
				new Date().toISOString(),
			]
		);
	}

	console.log("Creating demo project 2: Task Management API...");
	await d1Execute(
		`INSERT INTO "project" (id, name, description, visibility, owner_id, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			DEMO_PROJECT_2_ID,
			"Task Management API",
			"A RESTful API for task management with authentication, team collaboration, and real-time updates using WebSockets.",
			"public",
			DEMO_USER_ID,
			new Date().toISOString(),
			new Date().toISOString(),
		]
	);

	await d1Execute(
		`INSERT INTO "project_member" (id, project_id, user_id, role, created_at)
		 VALUES (?, ?, ?, ?, ?)`,
		[
			"demo-project-2-member",
			DEMO_PROJECT_2_ID,
			DEMO_USER_ID,
			"admin",
			new Date().toISOString(),
		]
	);

	console.log("Creating demo board 2: Development...");
	await d1Execute(
		`INSERT INTO "board" (id, name, description, visibility, owner_id, project_id, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			DEMO_BOARD_2_ID,
			"Development",
			"Development board for the Task Management API",
			"public",
			DEMO_USER_ID,
			DEMO_PROJECT_2_ID,
			new Date().toISOString(),
			new Date().toISOString(),
		]
	);

	console.log("Creating columns for board 2...");
	const columns2 = [
		{ id: "demo-col-2-1", name: "Backlog", position: 0 },
		{ id: "demo-col-2-2", name: "Active", position: 1 },
		{ id: "demo-col-2-3", name: "Complete", position: 2 },
	];

	for (const col of columns2) {
		await d1Execute(
			`INSERT INTO "column" (id, board_id, name, position, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[
				col.id,
				DEMO_BOARD_2_ID,
				col.name,
				col.position,
				new Date().toISOString(),
				new Date().toISOString(),
			]
		);
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
		if (c === undefined) {
			continue;
		}
		await d1Execute(
			`INSERT INTO "card" (id, board_id, card_number, column_id, title, type, description, acceptance_criteria, position, assignee_id, agent_trigger_url, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				`demo-card-2-${i + 1}`,
				DEMO_BOARD_2_ID,
				i + 1,
				c.colId,
				c.title,
				c.type,
				null,
				null,
				c.pos,
				null,
				null,
				new Date().toISOString(),
				new Date().toISOString(),
			]
		);
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
