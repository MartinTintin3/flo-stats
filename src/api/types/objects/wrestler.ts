import { GradeObject } from "./grade";
import { DateTime, FloBaseObject, ObjectIdentifier, UUID } from "../types";
import { LocationObject } from "./location";

export type WrestlerAttributes = {
	identityPersonId: UUID;
	city: string;
	divisionId: UUID;
	eventId: UUID;
	exactWeight: number;
	firstName: string;
	fullName: string;
	lastname: string;
	grade: GradeObject;
	gradeId: UUID | null;
	createdByUserId: string;
	createdDateTimeUtc: DateTime;
	modifiedByUserId: string | null;
	modifiedDateTimeUtc: DateTime;
	dateOfBirth: string | null;
	gender: string;
	isSkinChecked: boolean;
	isTeamScorer: boolean;
	isWeighInOk: boolean;
	location: LocationObject;
	nickname: string | null;
	state: string;
	teamId: UUID;
	weightClassId: UUID;
	withdrawn: boolean;
	zipCode: string | null;
}

export type WrestlerIdentifier = ObjectIdentifier & {
	type: "wrestler";
}

export type WrestlerObject = FloBaseObject<WrestlerIdentifier, WrestlerAttributes>;