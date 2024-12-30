
import { Accordion, Card, Stack, Text, Title } from "@mantine/core";
import { AllWrestlerRelationships } from "../api/types/relationships";
import { WrestlersResponse } from "../api/types/responses";
import { BracketPlacementObject } from "../api/types/objects/bracketPlacement";
import { DivisionObject } from "../api/types/objects/division";
import { EventObject } from "../api/types/objects/event";
import { WeightClassObject } from "../api/types/objects/weightClass";
import FloAPI from "../api/FloAPI";

import styles from "./PlacementsDisplay.module.css";
import { FloObject } from "../api/types/types";
import { WrestlerObject } from "../api/types/objects/wrestler";

export type PlacementsDisplayProps = {
	wrestlers: WrestlersResponse<AllWrestlerRelationships, Exclude<FloObject, WrestlerObject>>,
};

export default function PlacementsDisplay({ wrestlers }: PlacementsDisplayProps) {
	return (
		<Accordion p="2rem">
			{wrestlers?.data.map(wrestler => {
				//const wrestler = wrestlers.data.find(w => w.id == placement.attributes.wrestlerId);
				const placement = wrestler?.relationships.bracketPlacements.data.length ? FloAPI.findIncludedObjectById<BracketPlacementObject>(wrestler.relationships.bracketPlacements.data[0].id, "bracketPlacement", wrestlers) : null;
				const event = FloAPI.findIncludedObjectById<EventObject>(wrestler.attributes.eventId, "event", wrestlers);
				const weightClass = wrestler ? FloAPI.findIncludedObjectById<WeightClassObject>(wrestler.relationships.weightClass.data.id, "weightClass", wrestlers) : null;
				const division = wrestler ? FloAPI.findIncludedObjectById<DivisionObject>(wrestler.relationships.division.data.id, "division", wrestlers) : null;

				const color = placement?.attributes.placement == 1 ? "var(--mantine-color-green-4)" :
					placement?.attributes.placement == 2 ? "var(--mantine-color-green-2)" :
						placement?.attributes.placement == 3 ? "var(--mantine-color-green-1)" :
							event?.attributes.isDual ? "var(--mantine-color-gray-4)" :
								"var(--mantine-color-red-4)";

				return (
					<Accordion.Item key={wrestler.id} value={wrestler.id}>
						<Card className={styles.card}>
							<Accordion.Control>
								<Stack gap="xs" content="center" ta="center">
									<Title order={4} style={{ marginBottom: 0 }}>{event?.attributes.name}</Title>
									<Text size="xl" fw={placement?.attributes.placement == 1 ? 700 : 400} c={color}>
										{placement?.attributes.placementDisplay ?? "DNP"}</Text>
									<Text size="md" style={{marginBottom: 0 }}>{division?.attributes.name} {weightClass?.attributes.name} {division?.attributes.measurementUnit}</Text>
								</Stack>
							</Accordion.Control>
						</Card>
					</Accordion.Item>
				);
			})}
		</Accordion>
	);
}