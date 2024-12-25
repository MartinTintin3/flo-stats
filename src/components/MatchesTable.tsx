import { em, Group, Table, Text } from "@mantine/core";
import { BoutsResponse } from "../api/types/responses";
import { BoutObject } from "../api/types/objects/bout";
import { FloObject } from "../api/types/types";
import React from "react";
import FloAPI from "../api/FloAPI";
import { WrestlerObject } from "../api/types/objects/wrestler";
import dayjs from "dayjs";
import { EventObject } from "../api/types/objects/event";
import { AllBoutRelationships } from "../api/types/relationships";
import { data, Link } from "react-router";
import { RoundNameObject } from "../api/types/objects/roundName";
import { WeightClassObject } from "../api/types/objects/weightClass";
import { DivisionObject } from "../api/types/objects/division";

import styles from "./MatchesTable.module.css";
import { useMediaQuery } from "@mantine/hooks";

type MatchesTableProps = {
	athleteId: string;
	bouts: BoutsResponse<AllBoutRelationships, Exclude<FloObject, BoutObject>> | null,
	startDate?: Date | null,
	endDate?: Date | null,
}

export default function MatchesTable({ athleteId, bouts, startDate, endDate }: MatchesTableProps) {
	const mobile = useMediaQuery(`(max-width: ${em(750)})`);

	return (
		<Table styles={{ th: { textAlign: "center" }, td: { textAlign: "center" } }} w="100%" striped>
			<Table.Thead>
				<Table.Tr>
					<Table.Th className={styles.stickyMatch1} w="5rem" bg={"var(--mantine-color-body)"}>Date</Table.Th>
					<Table.Th className={styles.stickyMatch2} w="3rem" bg={"var(--mantine-color-body)"} styles={{ th: {
						boxShadow: "42px 108px 5px 0px var(--table-border-color)",
					}}}>W/L</Table.Th>
					<Table.Th className={styles.scrollableMatch}>Win Type</Table.Th>
					<Table.Th className={styles.scrollableMatch}>Result</Table.Th>
					<Table.Th className={styles.scrollableMatch}>Opponent</Table.Th>
					<Table.Th className={styles.scrollableMatch}>Event</Table.Th>
					<Table.Th className={styles.scrollableMatch}>Round</Table.Th>
					<Table.Th className={styles.scrollableMatch}>Weight</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{bouts?.data.filter(bout => {
					const date = dayjs(bout.attributes.goDateTime ?? bout.attributes.endDateTime ?? FloAPI.findIncludedObjectById<EventObject>(bout.attributes.eventId, "event", bouts)?.attributes.startDateTime);
					if (startDate && date.isBefore(dayjs(startDate))) return false;
					if (endDate && date.isAfter(dayjs(endDate))) return false;
					return true;
				}).sort((a, b) => {
					const aDateTime = dayjs(a.attributes.goDateTime ?? a.attributes.endDateTime ?? FloAPI.findIncludedObjectById<EventObject>(a.attributes.eventId, "event", bouts)?.attributes.startDateTime);
					const bDateTime = dayjs(b.attributes.goDateTime ?? b.attributes.endDateTime ?? FloAPI.findIncludedObjectById<EventObject>(b.attributes.eventId, "event", bouts)?.attributes.startDateTime);

					return aDateTime.isBefore(bDateTime) ? 1 : aDateTime.isAfter(bDateTime) ? -1 : 0;
				}).map((bout, index) => {
					const date = dayjs(bout.attributes.goDateTime ?? bout.attributes.endDateTime ?? FloAPI.findIncludedObjectById<EventObject>(bout.attributes.eventId, "event", bouts)?.attributes.startDateTime);
					const winner = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.winnerWrestlerId, "wrestler", bouts);

					const isAWin = winner?.attributes.identityPersonId == athleteId;

					const topWrestler = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.topWrestlerId, "wrestler", bouts);
					const bottomWrestler = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.bottomWrestlerId, "wrestler", bouts);

					const opponent = topWrestler?.attributes.identityPersonId == athleteId ? bottomWrestler : topWrestler;
					const thisWrestler = topWrestler?.attributes.identityPersonId == athleteId ? topWrestler : bottomWrestler;

					const weightClass = FloAPI.findIncludedObjectById<WeightClassObject>(bout.attributes.weightClassId, "weightClass", bouts);
					const roundName = FloAPI.findIncludedObjectById<RoundNameObject>(bout.attributes.roundNameId, "roundName", bouts);
					const event = FloAPI.findIncludedObjectById<EventObject>(bout.attributes.eventId, "event", bouts);
					const division = thisWrestler ? FloAPI.findIncludedObjectById<DivisionObject>(thisWrestler?.attributes.divisionId, "division", bouts) : undefined;
					return (
						<Table.Tr key={bout.id} className={styles.matchRow}>
							<Table.Td className={styles.stickyMatch1} w="5rem" bg={index % 2 == 0 ? "var(--table-striped-color)" : "var(--mantine-color-body)"}>{date.format("M/D/YY")}</Table.Td>
							<Table.Td className={styles.stickyMatch2} w="3rem" bg={index % 2 == 0 ? "var(--table-striped-color)" : "var(--mantine-color-body)"} c={isAWin ? "green" : "red"}>{isAWin ? "W" : "L"}</Table.Td>
							<Table.Td className={styles.scrollableMatch}>{bout.attributes.winType}</Table.Td>
							<Table.Td className={styles.scrollableMatch}>{bout.attributes.result}</Table.Td>
							<Table.Td className={styles.scrollableMatch}>
								<Link to={`/athletes/${opponent?.attributes.identityPersonId}`} style={{ textDecoration: "none" }}>
									{opponent?.attributes.firstName} {opponent?.attributes.lastName}
								</Link>
							</Table.Td>
							<Table.Td className={styles.scrollableMatch}>
								<Link to={`https://arena.flowrestling.org/event/${event?.id}`} target="__blank" style={{ textDecoration: "none" }}>
									<Text lineClamp={1}>{event?.attributes.name}</Text>
								</Link>
							</Table.Td>
							<Table.Td className={styles.scrollableMatch}>{roundName?.attributes.displayName}</Table.Td>
							<Table.Td className={styles.scrollableMatch}>{weightClass?.attributes.name} {division?.attributes.measurementUnit}</Table.Td>
						</Table.Tr>
					)
				})}
			</Table.Tbody>
		</Table>
	);
}