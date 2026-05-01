export const cardLinkType = [
	"parent_of",
	"child_of",
	"blocked_by",
	"blocks",
	"depends_on",
	"relates_to",
	"duplicates",
	"follows",
	"part_of",
	"implements",
] as const;

export type CardLinkType = (typeof cardLinkType)[number];
