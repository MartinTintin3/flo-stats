import { em, Group, Table, Text } from "@mantine/core";
import { BoutsResponse, WrestlersResponse } from "../api/types/responses";
import { BoutObject } from "../api/types/objects/bout";
import { FloObject } from "../api/types/types";
import React, { useMemo } from "react";
import FloAPI from "../api/FloAPI";
import { WrestlerObject } from "../api/types/objects/wrestler";
import dayjs, { Dayjs } from "dayjs";
import { EventObject } from "../api/types/objects/event";
import { AllBoutRelationships, AllWrestlerRelationships } from "../api/types/relationships";
import { data, Link } from "react-router";
import { RoundNameObject } from "../api/types/objects/roundName";
import { WeightClassObject } from "../api/types/objects/weightClass";
import { DivisionObject } from "../api/types/objects/division";

import { MantineReactTable, MRT_ColumnDef, useMantineReactTable } from "mantine-react-table";

import styles from "./MatchesTable.module.css";
import { useMediaQuery } from "@mantine/hooks";
import { TeamObject } from "../api/types/objects/team";
import { AthleteDataProps } from "../Athletes";

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
	roundName?: RoundNameObject;
	event: EventObject;
	division?: DivisionObject;
	bout: BoutObject;
};

export default function MatchesTable({ bouts, identityPersonId }: AthleteDataProps) {
	const mobile = useMediaQuery(`(max-width: ${em(750)})`);

	const columns = useMemo<MRT_ColumnDef<UsableData>[]>(() => [
		{
			header: "W/L",
			accessorFn: row => row.isAWin ? "W" : "L",
			id: "winLoss",
			Cell: ({ cell }) => <Text ta="center" size="sm" c={cell.getValue<string>() == "W" ? "green" : "red"}>{cell.getValue<string>()}</Text>,
			size: 50,
			enableSorting: false,
			Header: ({ column }) => <Text ta="center" size="sm">W/L</Text>,
			mantineTableBodyCellProps: {
				styles: {
					td: {
						justifyContent: "center"
					}
				}
			},
			enableColumnActions: false,
		},
		{
			header: "Date",
			accessorFn: row => row.date.unix(),
			id: "date", 	
			enablePinning: false,
			size: 120,
			Cell: ({ row }) => (
				<Text>{row.original.date.format("MM/DD/YY")}</Text>
			),
		},
		{
			header: "Opponent",
			accessorFn: row => row.noOpponent ? row.noOpponentString : `${row.opponent?.attributes.firstName} ${row.opponent?.attributes.lastName}`,
			id: "opponent",
			enablePinning: false,
			Cell: ({ row, renderedCellValue}) => (
				row.original.noOpponent ? 
				<Text fs={row.original.noOpponent ? "italic" : undefined} c={row.original.noOpponent ? "dimmed" : undefined}>
					{renderedCellValue}
				</Text> : 
				<Link to={`/athletes/${row.original.opponent?.attributes.identityPersonId}`} style={{ textDecoration: "none" }}>
					{renderedCellValue}
				</Link>
			),
		},
		{
			header: "Opp. Team",
			accessorFn: row => row.opponentTeam?.attributes.name,
			id: "opponentTeam",
			enablePinning: false,
		},
		{
			header: "Result",
			accessorFn: row => row.noOpponent ? row.bout.attributes.winType : `${row.bout.attributes.winType} ${row.bout.attributes.result}`,
			size: 120,
			id: "result",
			enablePinning: false,
		},
		{
			header: "Event",
			accessorFn: row => row.event.attributes.name,
			id: "event",
			enableResizing: true,
			enablePinning: false,
			size: mobile ? 200 : 300,
			Cell: ({ row, renderedCellValue }) => (
				<Link to={`https://arena.flowrestling.org/event/${row.original.event.id}`} target="__blank" style={{ textDecoration: "none", textOverflow: "ellipsis", overflow: "hidden" }}>
					{renderedCellValue}
				</Link>
			),
		},
		{
			header: "Round",
			accessorFn: row => row.roundName?.attributes.displayName,
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

		const isAWin = winner?.attributes.identityPersonId == identityPersonId;

		const topWrestler = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.topWrestlerId, "wrestler", bouts) as NonNullable<WrestlerObject>;
		const bottomWrestler = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.bottomWrestlerId, "wrestler", bouts) as NonNullable<WrestlerObject>;

		const opponent = topWrestler?.attributes.identityPersonId == identityPersonId ? bottomWrestler : topWrestler;
		const thisWrestler = topWrestler?.attributes.identityPersonId == identityPersonId ? topWrestler : bottomWrestler;

		const opponentTeam = FloAPI.findIncludedObjectById<TeamObject>(opponent?.attributes.teamId, "team", bouts);
		const thisTeam = FloAPI.findIncludedObjectById<TeamObject>(thisWrestler?.attributes.teamId, "team", bouts);
		if (!thisTeam) console.log("WTF no team found for wrestler", thisWrestler);

		const weightClass = FloAPI.findIncludedObjectById<WeightClassObject>(bout.attributes.weightClassId, "weightClass", bouts);
		const roundName = FloAPI.findIncludedObjectById<RoundNameObject>(bout.attributes.roundNameId, "roundName", bouts);
		const event = FloAPI.findIncludedObjectById<EventObject>(bout.attributes.eventId, "event", bouts);
		const division = thisWrestler ? FloAPI.findIncludedObjectById<DivisionObject>(thisWrestler?.attributes.divisionId, "division", bouts) : undefined;
		if (!division) console.log("WTF no division found for wrestler", thisWrestler);

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
		enableColumnPinning: true,
		enableBottomToolbar: false,
		mantineTopToolbarProps: {
			className: styles.matchesTopToolbar,
		},
		initialState: {
			density: "xs",
			sorting: [{ id: "date", desc: true }],
			columnPinning: {
				left: ["winLoss"],
			}
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

					const isAWin = winner?.attributes.identityPersonId == identityPersonId;

					const topWrestler = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.topWrestlerId, "wrestler", bouts) as NonNullable<WrestlerObject>;
					const bottomWrestler = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.bottomWrestlerId, "wrestler", bouts) as NonNullable<WrestlerObject>;

					const opponent = topWrestler?.attributes.identityPersonId == identityPersonId ? bottomWrestler : topWrestler;
					const thisWrestler = topWrestler?.attributes.identityPersonId == identityPersonId ? topWrestler : bottomWrestler;

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