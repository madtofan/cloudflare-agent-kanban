import { db } from "@cloudflare-agent-kanban/db";
import * as schema from "@cloudflare-agent-kanban/db/schema/auth";
import { env } from "@cloudflare-agent-kanban/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";

const usernameRegex = /^[a-z0-9_-]+$/;

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",

		schema: schema,
	}),
	trustedOrigins: [env.CORS_ORIGIN],
	emailAndPassword: {
		enabled: true,
	},
	// uncomment cookieCache setting when ready to deploy to Cloudflare using *.workers.dev domains
	// session: {
	//   cookieCache: {
	//     enabled: true,
	//     maxAge: 60,
	//   },
	// },
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
			secure: true,
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
