import { Table } from "@mantine/core";
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

type MatchesTableProps = {
	athleteId: string;
	bouts: BoutsResponse<AllBoutRelationships, Exclude<FloObject, BoutObject>> | null,
	startDate?: Date | null,
	endDate?: Date | null,
}

export default function MatchesTable({ athleteId, bouts, startDate, endDate }: MatchesTableProps) {
	/*const [processed, setProcessed] = React.useState<{
		won: boolean,
		date: number,
	}[]>();

	React.useEffect(() => {
		setProcessed(bouts?.data.map(bout => {
			const winner = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.winnerWrestlerId, "wrestler", bouts);

			return {
				won: true,
				date: Date.now(),
			};
		}));
	}, [bouts]);*/

	return (
		<Table styles={{ th: { textAlign: "center" } }}>
			<Table.Thead>
				<Table.Tr>
					{["Date", "W/L", "Wintype", "", "Opponent", "Event", "Round", "Weight"].map(heading => <Table.Th key={heading}>{heading}</Table.Th>)}
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
				}).map(bout => {
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
						<Table.Tr key={bout.id}>
							<Table.Td>{date.format("M/D/YY")}</Table.Td>
							<Table.Td c={isAWin ? "green" : "red"}>{isAWin ? "W" : "L"}</Table.Td>
							<Table.Td>{bout.attributes.result}</Table.Td>
							<Table.Td>{bout.attributes.winType}</Table.Td>
							<Table.Td>
								<Link to={`/athletes/${opponent?.attributes.identityPersonId}`} style={{ textDecoration: "none" }}>
									{opponent?.attributes.firstName} {opponent?.attributes.lastName}
								</Link>
							</Table.Td>
							<Table.Td>
								<Link to={`https://arena.flowrestling.org/event/${event?.id}`} target="__blank" style={{ textDecoration: "none" }}>
									{event?.attributes.name}
								</Link>
							</Table.Td>
							<Table.Td>{roundName?.attributes.displayName}</Table.Td>
							<Table.Td>{weightClass?.attributes.name} {division?.attributes.measurementUnit}</Table.Td>
						</Table.Tr>
					)
				})}
			</Table.Tbody>
		</Table>
	);
}