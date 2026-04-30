import { db } from "@cloudflare-agent-kanban/db";
// biome-ignore lint/performance/noNamespaceImport: We really want to import all of the schema
import * as schema from "@cloudflare-agent-kanban/db/schema/auth";
import { env } from "@cloudflare-agent-kanban/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";

const usernameRegex = /^[a-z0-9_-]+$/;

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",

		schema,
	}),
	trustedOrigins: [env.CORS_ORIGIN],
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	plugins: [
		username({
			minUsernameLength: 6,
			maxUsernameLength: 30,
			usernameValidator: (username) => usernameRegex.test(username),
		}),
	],
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
		},
		// uncomment crossSubDomainCookies setting when ready to deploy and replace <your-workers-subdomain> with your actual workers subdomain
		// https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
		// crossSubDomainCookies: {
		//   enabled: true,
		//   domain: "<your-workers-subdomain>",
		// },
	},
});
