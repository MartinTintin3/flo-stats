import { DateTime, FloBaseObject, ObjectIdentifier, UUID } from "../types";

export type BracketPlacementAttributes = {
	boutId: UUID;
	boutPoolId: UUID;
	createdByUserId: string;
	createDateTimeUtc: DateTime;
	eventId: UUID;
	modifiedByUserId: string;
	modifiedDateTimeUtc: DateTime;
	placement: number;
	placementDisplay: string;
	winnerPoints: number;
	wrestlerId: UUID;
}

export type BracketPlacementIdentifier = ObjectIdentifier & {
	type: "bracketPlacement";
}

export type BracketPlacementObject = FloBaseObject<BracketPlacementIdentifier, BracketPlacementAttributes>;