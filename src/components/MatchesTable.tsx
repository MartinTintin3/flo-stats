import { em, Group, Table, Text } from "@mantine/core";
import { BoutsResponse } from "../api/types/responses";
import { BoutObject } from "../api/types/objects/bout";
import { FloObject } from "../api/types/types";
import React, { useMemo } from "react";
import FloAPI from "../api/FloAPI";
import { WrestlerObject } from "../api/types/objects/wrestler";
import dayjs, { Dayjs } from "dayjs";
import { EventObject } from "../api/types/objects/event";
import { AllBoutRelationships } from "../api/types/relationships";
import { data, Link } from "react-router";
import { RoundNameObject } from "../api/types/objects/roundName";
import { WeightClassObject } from "../api/types/objects/weightClass";
import { DivisionObject } from "../api/types/objects/division";

import { MantineReactTable, MRT_ColumnDef, useMantineReactTable } from "mantine-react-table";

import styles from "./MatchesTable.module.css";
import { useMediaQuery } from "@mantine/hooks";
import { TeamObject } from "../api/types/objects/team";

type MatchesTableProps = {
	athleteId: string;
	bouts: BoutsResponse<AllBoutRelationships, Exclude<FloObject, BoutObject>> | null,
	startDate?: Date | null,
	endDate?: Date | null,
}

type UsableData = {
	date: dayjs.Dayjs;
	winner: WrestlerObject;
	noOpponent: boolean;
	noOpponentString: string;
	isAWin: boolean;
	opponent?: WrestlerObject;
	opponentTeam?: TeamObject;
	thisWrestler: WrestlerObject;
	thisTeam: TeamObject;
	weightClass: WeightClassObject;
	roundName: RoundNameObject;
	event: EventObject;
	division?: DivisionObject;
	bout: BoutObject;
};

export default function MatchesTable({ athleteId, bouts, startDate, endDate }: MatchesTableProps) {
	const mobile = useMediaQuery(`(max-width: ${em(750)})`);

	const columns = useMemo<MRT_ColumnDef<UsableData>[]>(() => [
		{
			header: "W/L",
			accessorFn: row => row.isAWin ? "W" : "L",
			id: "winLoss",
			Cell: ({ cell }) => <Text ta="center" size="sm" c={cell.getValue<string>() == "W" ? "green" : "red"}>{cell.getValue<string>()}</Text>,
			size: 120,
			enableSorting: false,
			mantineTableHeadCellProps: {
				styles: {
					th: {
						justifyContent: "center",
					}
				}
			},
			mantineTableBodyCellProps: {
				styles: {
					td: {
						justifyContent: "center"
					}
				}
			},
		},
		{
			header: "Date",
			accessorFn: row => row.date.unix(),
			id: "date",
			Cell: ({ cell }) => <Text size="sm">{dayjs(cell.getValue<number>()).format("MM/DD/YY")}</Text>,
		},
		{
			header: "Opponent",
			accessorFn: row => row.noOpponent ? row.noOpponentString : row.opponent!.attributes.identityPersonId,
			id: "opponent",
			Cell: ({ row }) => (
				row.original.noOpponent ? <Text size="sm" fs={row.original.noOpponent ? "italic" : undefined} c={row.original.noOpponent ? "dimmed" : undefined}>{row.original.noOpponentString}</Text> : 
				<Link to={`/athletes/${row.original.opponent?.attributes.identityPersonId}`} style={{ textDecoration: "none" }}>
					{row.original.opponent?.attributes.firstName ?? row.original.noOpponentString} {row.original.opponent?.attributes.lastName}
				</Link>
					
			),
		},
		{
			header: "Opp. Team",
			accessorFn: row => row.opponentTeam?.attributes.name,
			id: "opponentTeam",
		},
		{
			header: "Result",
			accessorFn: row => `${row.bout.attributes.winType} ${row.bout.attributes.result}`,
			id: "result",
		},
		{
			header: "Event",
			accessorFn: row => row.event.attributes.name,
			id: "event",
			enableResizing: true,
		},
		{
			header: "Round",
			accessorFn: row => row.roundName.attributes.displayName,
			id: "round",
		},
		{
			header: "Weight",
			accessorFn: row => `${row.weightClass.attributes.name} ${row.division?.attributes.measurementUnit}`,
			id: "weight",
		}
	], []);

	const tableData = useMemo(() => bouts?.data.sort((a, b) => {
		const aDateTime = dayjs(a.attributes.goDateTime ?? a.attributes.endDateTime ?? FloAPI.findIncludedObjectById<EventObject>(a.attributes.eventId, "event", bouts)?.attributes.startDateTime);
		const bDateTime = dayjs(b.attributes.goDateTime ?? b.attributes.endDateTime ?? FloAPI.findIncludedObjectById<EventObject>(b.attributes.eventId, "event", bouts)?.attributes.startDateTime);

		return aDateTime.isBefore(bDateTime) ? 1 : aDateTime.isAfter(bDateTime) ? -1 : 0;
	}).map(bout => {
		const date = dayjs(bout.attributes.goDateTime ?? bout.attributes.endDateTime ?? FloAPI.findIncludedObjectById<EventObject>(bout.attributes.eventId, "event", bouts)?.attributes.startDateTime);
		const winner = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.winnerWrestlerId, "wrestler", bouts) as NonNullable<WrestlerObject>;

		const noOpponent = bout.attributes.winType == "FOR" || bout.attributes.winType == "BYE";
		const noOpponentString = bout.attributes.winType == "FOR" ? "Forfeit" : "Bye";

		const isAWin = winner?.attributes.identityPersonId == athleteId;

		const topWrestler = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.topWrestlerId, "wrestler", bouts) as NonNullable<WrestlerObject>;
		const bottomWrestler = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.bottomWrestlerId, "wrestler", bouts) as NonNullable<WrestlerObject>;

		const opponent = topWrestler?.attributes.identityPersonId == athleteId ? bottomWrestler : topWrestler;
		const thisWrestler = topWrestler?.attributes.identityPersonId == athleteId ? topWrestler : bottomWrestler;

		const opponentTeam = FloAPI.findIncludedObjectById<TeamObject>(opponent?.attributes.teamId, "team", bouts);
		const thisTeam = FloAPI.findIncludedObjectById<TeamObject>(thisWrestler?.attributes.teamId, "team", bouts);
		if (!thisTeam) console.log("WTF no team found for wrestler", thisWrestler);

		const weightClass = FloAPI.findIncludedObjectById<WeightClassObject>(bout.attributes.weightClassId, "weightClass", bouts);
		const roundName = FloAPI.findIncludedObjectById<RoundNameObject>(bout.attributes.roundNameId, "roundName", bouts);
		const event = FloAPI.findIncludedObjectById<EventObject>(bout.attributes.eventId, "event", bouts);
		const division = thisWrestler ? FloAPI.findIncludedObjectById<DivisionObject>(thisWrestler?.attributes.divisionId, "division", bouts) : undefined;

		return {
			date,
			winner,
			noOpponent,
			noOpponentString,
			isAWin,
			opponent,
			opponentTeam,
			thisWrestler,
			thisTeam,
			weightClass,
			roundName,
			event,
			division,
			bout,
		} as UsableData;
	}) ?? [], [bouts]);

	const table = useMantineReactTable({
		columns,
		data: tableData,
		enablePagination: false,
		initialState: {
			density: "xs",
			sorting: [{ id: "date", desc: true }],
		},
		layoutMode: "grid-no-grow",
	});

	return (
		<MantineReactTable
			table={table}
		/>
		/*<Table styles={{ th: { textAlign: "left" }, td: { textAlign: "left" } }} w="100%" striped>
			<Table.Thead>
				<Table.Tr>
					<Table.Th className={styles.stickyMatch1} ta="center" w="5rem" bg={"var(--mantine-color-body)"}>W/L</Table.Th>
					<Table.Th className={styles.scrollableMatch}>Date</Table.Th>
					<Table.Th className={styles.scrollableMatch}>Opponent</Table.Th>
					<Table.Th className={styles.scrollableMatch}>Opp. Team</Table.Th>
					<Table.Th className={styles.scrollableMatch}>Result</Table.Th>
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

					const noOpponent = bout.attributes.winType == "FOR" || bout.attributes.winType == "BYE";
					const noOpponentString = bout.attributes.winType == "FOR" ? "Forfeit" : "Bye";

					const isAWin = winner?.attributes.identityPersonId == athleteId;

					const topWrestler = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.topWrestlerId, "wrestler", bouts) as NonNullable<WrestlerObject>;
					const bottomWrestler = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.bottomWrestlerId, "wrestler", bouts) as NonNullable<WrestlerObject>;

					const opponent = topWrestler?.attributes.identityPersonId == athleteId ? bottomWrestler : topWrestler;
					const thisWrestler = topWrestler?.attributes.identityPersonId == athleteId ? topWrestler : bottomWrestler;

					const opponentTeam = FloAPI.findIncludedObjectById<TeamObject>(opponent?.attributes.teamId, "team", bouts);
					const thisTeam = FloAPI.findIncludedObjectById<TeamObject>(thisWrestler?.id, "team", bouts);

					const weightClass = FloAPI.findIncludedObjectById<WeightClassObject>(bout.attributes.weightClassId, "weightClass", bouts);
					const roundName = FloAPI.findIncludedObjectById<RoundNameObject>(bout.attributes.roundNameId, "roundName", bouts);
					const event = FloAPI.findIncludedObjectById<EventObject>(bout.attributes.eventId, "event", bouts);
					const division = thisWrestler ? FloAPI.findIncludedObjectById<DivisionObject>(thisWrestler?.attributes.divisionId, "division", bouts) : undefined;
					return (
						<Table.Tr key={bout.id} className={styles.matchRow}>
							<Table.Td className={styles.stickyMatch1} w="3rem" ta="center" bg={index % 2 == 0 ? "var(--table-striped-color)" : "var(--mantine-color-body)"} c={isAWin ? "green" : "red"}>{isAWin ? "W" : "L"}</Table.Td>
							<Table.Td className={styles.scrollableMatch} bg={index % 2 == 0 ? "var(--table-striped-color)" : "var(--mantine-color-body)"}>{date.format("M/D/YY")}</Table.Td>
							<Table.Td className={styles.scrollableMatch}>
								{noOpponent ? <Text size="sm" fs={noOpponent ? "italic" : undefined} c={noOpponent ? "dimmed" : undefined}>{noOpponentString}</Text> : 
									<Link to={`/athletes/${opponent?.attributes.identityPersonId}`} style={{ textDecoration: "none" }}>
										{opponent?.attributes.firstName ?? noOpponentString} {opponent?.attributes.lastName}
									</Link>
								}
							</Table.Td>
							<Table.Td className={styles.scrollableMatch}>
								<Text size="sm" w={120} truncate="end">{opponentTeam?.attributes.name}</Text>
							</Table.Td>
							<Table.Td className={styles.scrollableMatch}>{bout.attributes.winType} {bout.attributes.result}</Table.Td>
							<Table.Td className={styles.scrollableMatch}>
								<Link to={`https://arena.flowrestling.org/event/${event?.id}`} target="__blank" style={{ textDecoration: "none" }}>
									<Text w={300} truncate="end">{event?.attributes.name}</Text>
								</Link>
							</Table.Td>
							<Table.Td className={styles.scrollableMatch}>{roundName?.attributes.displayName}</Table.Td>
							<Table.Td className={styles.scrollableMatch}>{weightClass?.attributes.name} {division?.attributes.measurementUnit}</Table.Td>
						</Table.Tr>
					)
				})}
			</Table.Tbody>
		</Table>*/
	);
}