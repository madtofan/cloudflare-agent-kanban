import { auth } from "@cloudflare-agent-kanban/auth";

export interface McpAuthContext {
	session: {
		id: string;
	};
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
}

export async function validateSession(
	request: Request
): Promise<McpAuthContext> {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		throw new Error("Missing or invalid Authorization header");
	}

	const headers = new Headers();
	headers.set("Authorization", authHeader);

	const session = await auth.api.getSession({ headers });

	if (!(session?.user && session.session)) {
		throw new Error("Invalid or expired session token");
	}

	return {
		user: {
			id: session.user.id,
			name: session.user.name,
			email: session.user.email,
			image: session.user.image ?? null,
		},
		session: {
			id: session.session.id,
		},
	};
}
