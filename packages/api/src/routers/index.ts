import type {
	InferRouterInputs,
	InferRouterOutputs,
	RouterClient,
} from "@orpc/server";

import { publicProcedure } from "../index";
import { boardRouter } from "./board";
import { cardRouter } from "./card";
import { columnRouter } from "./column";
import { contactRouter } from "./contact";
import { notificationRouter } from "./notification";
import { profileRouter } from "./profile";
import { projectRouter } from "./project";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	board: boardRouter,
	card: cardRouter,
	column: columnRouter,
	contact: contactRouter,
	notification: notificationRouter,
	profile: profileRouter,
	project: projectRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
export type OrpcInput = InferRouterInputs<typeof appRouter>;
export type OrpcOutput = InferRouterOutputs<typeof appRouter>;
