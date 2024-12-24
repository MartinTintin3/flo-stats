import { BoutIdentifier } from "./objects/bout";
import { DivisionIdentifier } from "./objects/division";
import { EventIdentifier } from "./objects/event";
import { GradeIdentifier } from "./objects/grade";
import { RoundNameIdentifier } from "./objects/roundName";
import { TeamIdentifier } from "./objects/team";
import { WeightClassIdentifier } from "./objects/weightClass";
import { WrestlerIdentifier } from "./objects/wrestler";

export type Relationship = TopWrestlerRelationship | BottomWrestlerRelationship | WeightClassRelationship | TeamRelationship | RoundNameRelationship | GradeRelationship | DivisionRelationship | EventRelationship | BoutRelationship;

export type RelationshipToWrestler = Exclude<Relationship, TopWrestlerRelationship | BottomWrestlerRelationship>;
export type RelationshipToBout = Exclude<Relationship, BoutRelationship>;

export type TopWrestlerRelationship = { topWrestler: { data: WrestlerIdentifier } };
export type BottomWrestlerRelationship = { bottomWrestler: { data: WrestlerIdentifier } };
export type WeightClassRelationship = { weightClass: { data: WeightClassIdentifier } };
export type TeamRelationship = { team: { data: TeamIdentifier } };
export type RoundNameRelationship = { roundName: { data: RoundNameIdentifier } };
export type GradeRelationship = { grade: { data: GradeIdentifier } };
export type DivisionRelationship = { division: { data: DivisionIdentifier } };
export type BoutRelationship = { bout: { data: BoutIdentifier } };
export type EventRelationship = { event: { data: EventIdentifier } };

export type AllBoutRelationships = TopWrestlerRelationship & BottomWrestlerRelationship & WeightClassRelationship & RoundNameRelationship & EventRelationship;
