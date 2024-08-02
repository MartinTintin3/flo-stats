import { DateTime, FloBaseObject, ObjectIdentifier, UUID } from "../types";
import { LocationObject } from "./location";

export type TeamAttributes = {
	abbreviation: string | null;
	city: string | null;
	createdByUserId: number;
	createdDateTimeUtc: DateTime;
	eventId: UUID;
	identityTeamId: UUID | null;
	location: LocationObject;
	modifiedByUserId: number | null;
	modifiedDateTimeUtc: DateTime | null;
	name: string;
	registeredWrestlerCount: number;
	state: string | null;
	zipCode: string | null;
}

export type TeamIdentifier = ObjectIdentifier & {
	type: "team";
}

export type TeamObject = FloBaseObject<TeamIdentifier, TeamAttributes>;