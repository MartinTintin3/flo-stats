import { FloBaseObject, DateTime, ObjectIdentifier, UUID } from "../types";

export type RoundNameAttributes = {
	createdByUserId: string;
	createdDateTimeUtc: DateTime;
	modifiedByUserId: string | null;
	modifiedDateTimeUtc: DateTime | null;
	eventId: UUID;
	systemName: string;
	displayName: string;
	sequence: number;
	visibility: number;
}

export type RoundNameIdentifier = ObjectIdentifier & {
	type: "roundName";
}

export type RoundNameObject = FloBaseObject<RoundNameIdentifier, RoundNameAttributes>;