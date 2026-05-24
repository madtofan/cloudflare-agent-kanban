import { drizzle } from "drizzle-orm/durable-sqlite";
// biome-ignore lint/performance/noNamespaceImport: Whole schema import
import * as schema from "./schema";

export function createDoDb(storage: DurableObjectStorage) {
	return drizzle(storage, { schema });
}
