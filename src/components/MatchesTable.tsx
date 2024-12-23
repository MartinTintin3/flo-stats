import { Table } from "@mantine/core";
import { BoutsResponse } from "../api/types/responses";
import { BoutObject } from "../api/types/objects/bout";
import { FloObject } from "../api/types/types";
import React from "react";
import FloAPI from "../api/FloAPI";
import { WrestlerObject } from "../api/types/objects/wrestler";
import dayjs from "dayjs";

type MatchesTableProps = {
	athleteId: string;
	bouts: BoutsResponse<void, Exclude<FloObject, BoutObject>> | null,
}

export default function MatchesTable({ athleteId, bouts }: MatchesTableProps) {
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
		<Table>
			<Table.Thead>
				{["Date", "W/L", "Result", "Opponent", "Round", "Weight"].map(h => <Table.Th>{h}</Table.Th>)}
			</Table.Thead>
			<Table.Tbody>
				{bouts?.data.map(bout => {
					return (
						<Table.Tr>
							<Table.Td>{dayjs(bout.attributes.goDateTime ?? bout.attributes.endDateTime).format("M/D")}</Table.Td>
							<Table.Td>{FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.winnerWrestlerId, "wrestler", bouts)?.attributes.identityPersonId == athleteId ? "W" : "L"}</Table.Td>
						</Table.Tr>
					);
				})}
			</Table.Tbody>
		</Table>
	);
}