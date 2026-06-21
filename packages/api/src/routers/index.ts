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
import { documentationRouter } from "./documentation";
import { notificationRouter } from "./notification";
import { profileRouter } from "./profile";
import { projectRouter } from "./project";
import { tokenRouter } from "./token";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	board: boardRouter,
	card: cardRouter,
	column: columnRouter,
	contact: contactRouter,
	documentation: documentationRouter,
	notification: notificationRouter,
	profile: profileRouter,
	project: projectRouter,
	token: tokenRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
export type OrpcInput = InferRouterInputs<typeof appRouter>;
export type OrpcOutput = InferRouterOutputs<typeof appRouter>;
