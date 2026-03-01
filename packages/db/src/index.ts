import { env } from "@cloudflare-agent-kanban/env/server";
import { drizzle } from "drizzle-orm/d1";

// biome-ignore lint/performance/noNamespaceImport: We really want to import all of the schema
import * as schema from "./schema";

export const db = drizzle(env.DB, { schema });
