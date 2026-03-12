import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

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
const token = process.env.SEED_API_TOKEN;
const localDbPath = process.env.LOCAL_DB_PATH;

const config = {
	schema: "./src/schema",
	out: "./src/migrations",
	dialect: "sqlite" as const,
	...(localDbPath
		? {
				dbCredentials: {
					url: localDbPath,
				},
			}
		: {
				driver: "d1-http" as const,
				dbCredentials: {
					accountId: accountId ?? "",
					databaseId: databaseId ?? "",
					token: token ?? "",
				},
			}),
};

if (!(localDbPath || (accountId && databaseId && token))) {
	throw new Error(
		"Missing required environment variables: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, SEED_API_TOKEN"
	);
}

export default defineConfig(config);
