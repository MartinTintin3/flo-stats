import { DateTime, FloBaseObject, ObjectIdentifier, UUID } from "../types";

export type WeightClassAttributes = {
	createdByUserId: number;
	createdDateTimeUtc: DateTime;
	divisionId: UUID;
	eventId: UUID;
	maxWeight: number;
	maxWrestlerCount: number | null;
	minWeight: number;
	modifiedByUserId: number;
	modifiedDateTimeUtc: DateTime;
	name: string;
	sequence: number;
}

export type WeightClassIdentifier = ObjectIdentifier & {
	type: "weightClass";
}

export type WeightClassRelationship = {
	weightClass: { data: WeightClassIdentifier };
}

export type WeightClassObject = FloBaseObject<WeightClassIdentifier, WeightClassAttributes>;