export { getProjectAccess, type ProjectAccess } from "./access";

export {
	generateToken,
	getPartialToken,
	hashToken,
	isApiToken,
	type ValidatedApiToken,
	validateApiToken,
} from "./token";

import type { OpenAPIV3_1 } from "openapi-types";

export function withErrorResponses(
	errors: Record<string, string>
): (op: OpenAPIV3_1.OperationObject) => OpenAPIV3_1.OperationObject {
	return (op) => ({
		...op,
		responses: {
			...op.responses,
			...Object.fromEntries(
				Object.entries(errors).map(([code, description]) => [
					code,
					{
						description,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: { type: "string" },
									},
								},
							},
						},
					} satisfies OpenAPIV3_1.ResponseObject,
				])
			),
		} satisfies OpenAPIV3_1.ResponsesObject,
	});
}
