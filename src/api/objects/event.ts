import { FloBaseObject, DateTime, ObjectIdentifier, UUID } from "../types";
import { LocationObject } from "./location";

export type EventAttributes = {
	apiHost: string;
	city: string;
	clonedFromEventId: UUID | null;
	createdDateTimeUtc: DateTime;
	description: string;
	endDateTime: DateTime;
	firebasehost: string;
	isArenaSync: boolean;
	isDual: boolean;
	isLivescorerTestMode: boolean;
	isParticipantWaiverRequired: boolean;
	isPresetTeams: boolean;
	isSetupComplete: boolean;
	isTestEvent: boolean;
	isVisible: boolean;
	location: LocationObject;
	locationName: string;
	maxWrestlerCount: number | null;
	modifiedDateTimeUtc: DateTime;
	name: string;
	participantAlias: string;
	participantAliasPlural: string;
	registrationReceiptMsg: string;
	resultsEmailsSentDateTime: DateTime | null;
	sendAnnouncerChatsToAdmins: boolean;
	startDateTime: DateTime;
	state: string;
	stripeAccountId: string;
	timeZone: string;
	websiteUrl: string;
}

export type EventIdentifier = ObjectIdentifier & {
	type: "event";
}

export type EventRelationship = {
	event: { data: EventIdentifier };
}

export type EventObject = FloBaseObject<EventIdentifier, EventAttributes>;