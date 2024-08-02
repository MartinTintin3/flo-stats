import { FloBaseObject, DateTime, ObjectIdentifier } from "../types";

export type RoundNameAttributes = {
	reatedDateTimeUtc: DateTime;
}

export type RoundNameIdentifier = ObjectIdentifier & {
	type: "roundName";
}

export type RoundNameRelationship = {
	roundName: { data: RoundNameIdentifier };
}

export type RoundNameObject = FloBaseObject<RoundNameIdentifier, RoundNameAttributes>;