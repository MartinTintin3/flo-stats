import { GradeObject } from "./grade";
import { FloBaseObject, ObjectIdentifier, UUID } from "../types";

export type WrestlerAttributes = {
	city: string;
	divisionId: UUID;
	eventId: UUID;
	exactWeight: number;
	firstName: string;
	fullName: string;
	lastname: string;
	grade: GradeObject;
	gradeId: UUID;
	identityPersonId: UUID;
	isSkinChecked: boolean;
	isTeamScorer: boolean;
	isWeighInOk: boolean;
	location: {
		address: string | null;
		city: string;
		country: string;
		googlePlaceId: string;
		id: string;
		latitude: number;
		longitude: number;
		name: string;
		state: string;
		zipCode: string | null;
	}
	modifiedDateTime: string;
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

export type TopWrestlerRelationship = {
	topWrestler: { data: WrestlerIdentifier };
}

export type BottomWrestlerRelationship = {
	bottomWrestler: { data: WrestlerIdentifier };
}

export type WrestlerObject = FloBaseObject<WrestlerIdentifier, WrestlerAttributes>;