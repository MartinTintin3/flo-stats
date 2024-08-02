import { FloBaseObject, DateTime, ObjectIdentifier, UUID } from "../types";

export type BoutAttributes = {
	eventId: UUID;
	dualId: UUID | null;
	bottomWrestlerId: UUID;
	bottomWrestlerScore: number;
	boutNumber: string;
	boutPoolId: UUID;
	bracketSize: number;
	createdDateTimeUtc: DateTime;
	endDateTime: DateTime;
	goDateTime: DateTime;
	isBottomBye: boolean;
	isConfirmed: boolean;
	isConsolation: boolean;
	isInProgress: boolean;
	isPlace: boolean;
	isPrinted: boolean;
	isRepechange: boolean;
	isTopBye: boolean;
	loserToBoutId: string | null;
	mat: UUID | null;
	matchQueueId: UUID;
	maxPlace: number;
	modifiedDateTimeUtc: DateTime;
	naturalRound: number;
	redWrestler: UUID;
	result: string;
	roundNameId: UUID;
	roundSpot: number;
	sequenceNumber: number;
	staticSequenceNumber: number;
	topWrestlerId: UUID;
	topWrestlerScore: number;
	trueRound: number;
	weightClassId: UUID;
	winType: string;
	winnerPoints: number;
	winnerToBoutId: UUID;
	winnerToTop: boolean;
	winnerWrestlerId: UUID;
};

export type BoutIdentifier = ObjectIdentifier & {
	type: "bout";
}

export type BoutObject = FloBaseObject<BoutIdentifier, BoutAttributes>;