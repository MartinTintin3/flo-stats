import { DateTime, FloBaseObject, ObjectIdentifier, UUID } from "../types";
import { GradeObject } from "./grade";

export type DivisionAttributes = {
	abbreviation: string | null;
	createdByUserId: string;
	createdDateTimeUtc: DateTime;
	displayBlackWhite: boolean;
	divisionGroupingType: "grade";
	divisionProfileId: UUID;
	enableSeperateion: boolean;
	eventId: UUID;
	eventTimeZone: string;
	floLevelId: UUID;
	hideByes: boolean;
	isDual: boolean;
	isVarsity: boolean;
	maskSeeds: boolean;
	maxPerBracket: number;
	measurementUnits: "lbs";
	modifiedByUserId: string;
	modifiedDateTimeUtc: DateTime;
	name: string;
	oldestGrade: GradeObject;
	oldestGradeId: UUID;
	publishBrackets: boolean;
	sequence: number;
	teamScoreGroupId: UUID;
	weighInEndDateTime: DateTime;
	weighInStartDateTime: DateTime;
	youngestGrade: GradeObject;
	youngestGradeId: UUID;
}

export type DivisionIdentifier = ObjectIdentifier & {
	type: "division";
}

export type DivisionObject = FloBaseObject<DivisionIdentifier, DivisionAttributes>;