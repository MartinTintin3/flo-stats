export type UUID = string;
export type DateTime = string;

export type ObjectIdentifier = {
	type: string;
	id: UUID;
}

export type FloBaseObject<Identifier, Attributes> = Identifier & {
	attributes: Attributes;
}