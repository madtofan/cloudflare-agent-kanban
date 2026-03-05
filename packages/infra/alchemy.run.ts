// biome-ignore-all lint/style/noNonNullAssertion: Infra works
import alchemy from "alchemy";
import { D1Database, R2Bucket, Vite, Worker } from "alchemy/cloudflare";
import { config } from "dotenv";

config({
	path: process.env.NODE_ENV === "production" ? "./.env.prod" : "./.env",
});
config({
	path:
		process.env.NODE_ENV === "production"
			? "../../apps/web/.env.prod"
			: "../../apps/web/.env",
});
config({
	path:
		process.env.NODE_ENV === "production"
			? "../../apps/server/.env.prod"
			: "../../apps/server/.env",
});

const app = await alchemy("cloudflare-agent-kanban");

const db = await D1Database("database", {
	migrationsDir: "../../packages/db/src/migrations",
});

const r2Bucket = await R2Bucket("profile-images");

export const web = await Vite("web", {
	cwd: "../../apps/web",
	assets: "dist",
	bindings: {
		VITE_SERVER_URL: alchemy.env.VITE_SERVER_URL!,
		VITE_R2_PUBLIC_URL: alchemy.env.VITE_R2_PUBLIC_URL!,
	},
});

export const server = await Worker("server", {
	cwd: "../../apps/server",
	entrypoint: "src/index.ts",
	compatibility: "node",
	bindings: {
		DB: db,
		CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
		BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
		BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
		R2_BUCKET: r2Bucket,
		R2_PUBLIC_URL: alchemy.env.VITE_R2_PUBLIC_URL!,
	},
	dev: {
		port: 3000,
	},
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
