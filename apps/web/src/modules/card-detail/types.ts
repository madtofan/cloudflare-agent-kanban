import type { OrpcOutput } from "@cloudflare-agent-kanban/api/routers/index";

export type KanbanCard = NonNullable<OrpcOutput["card"]["getById"]>;
