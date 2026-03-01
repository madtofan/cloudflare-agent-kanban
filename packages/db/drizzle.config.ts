import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
	path: "../../apps/server/.env",
});

const dbCredential = {
	dbCredentials: {
		url: process.env.LOCAL_DB_PATH!,
	},
};

export default defineConfig({
	schema: "./src/schema",
	out: "./src/migrations",
	// DOCS: https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit
	dialect: "sqlite",
	...(process.env.LOCAL_DB_PATH ? dbCredential : {
		driver: "d1-http",
	}),
});
