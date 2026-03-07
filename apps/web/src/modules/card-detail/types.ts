import type { OrpcOutput } from "@cloudflare-agent-kanban/api/routers/index";

type CardsOnColumns = NonNullable<OrpcOutput["card"]["getByBoardId"]>;
export type KanbanCard = CardsOnColumns[keyof CardsOnColumns][0];
