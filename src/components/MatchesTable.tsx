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

type MatchesTableProps = {
	athleteId: string;
	bouts: BoutsResponse<AllBoutRelationships, Exclude<FloObject, BoutObject>> | null,
	startDate?: Date | null,
	endDate?: Date | null,
}

export default function MatchesTable({ athleteId, bouts, startDate, endDate }: MatchesTableProps) {
	const [processed, setProcessed] = React.useState<{
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
	}, [bouts]);

	return (
		<Table styles={{ th: { textAlign: "center" } }}>
			<Table.Thead>
				{["Date", "W/L", "Wintype", "", "Opponent", "Round", "Weight"].map(h => <Table.Th>{h}</Table.Th>)}
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

					console.log(opponent?.attributes);

					return (
						<Table.Tr>
							<Table.Td>{date.format("M/D/YY")}</Table.Td>
							<Table.Td>{isAWin ? "W" : "L"}</Table.Td>
							<Table.Td>{bout.attributes.result}</Table.Td>
							<Table.Td>{bout.attributes.winType}</Table.Td>
							<Table.Td>{opponent?.attributes.firstName} {opponent?.attributes.lastName}</Table.Td>
						</Table.Tr>
					)
				})}
			</Table.Tbody>
		</Table>
	);
}