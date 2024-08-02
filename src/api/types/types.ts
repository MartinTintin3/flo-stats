import { BoutObject } from "./objects/bout";
import { DivisionObject } from "./objects/division";
import { EventObject } from "./objects/event";
import { GradeObject } from "./objects/grade";
import { RoundNameObject } from "./objects/roundName";
import { TeamObject } from "./objects/team";
import { WeightClassObject } from "./objects/weightClass";
import { WrestlerObject } from "./objects/wrestler";

export type UUID = string;
export type DateTime = string;

export type ObjectIdentifier = {
	type: FloObjectTypeString;
	id: UUID;
}

export type FloBaseObject<Identifier, Attributes> = Identifier & {
	attributes: Attributes;
}

export type FloObject = BoutObject | DivisionObject | EventObject | GradeObject | RoundNameObject | TeamObject | WeightClassObject | WrestlerObject;

export type FloObjectTypeString = "bout" | "division" | "event" | "grade" | "roundName" | "team" | "weightClass" | "wrestler";

export type Nothing = Record<string, never>;

export const BoutsIncludeAll = ["bottomWrestler", "bottomWrestler.team", "topWrestler.team", "weightClass", "topWrestler.division", "bottomWrestler.division", "event", "roundName"] as const;
export type BoutsIncludeString = typeof BoutsIncludeAll[number];
export const WrestlersIncludeAll = ["bracketPlacements.weightClass", "bracketPlacements", "division", "event", "weightClass", "team"];
export type WrestlersIncludeString = typeof WrestlersIncludeAll[number];

export type NonNullableFields<T> = {
	[P in keyof T]: NonNullable<T[P]>;
};