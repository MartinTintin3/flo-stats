import React from "react";
import { Card, Group, Text } from "@mantine/core";
import { AthleteDataProps } from "../Athletes";

type Ratio = [number, number];

type Stats = {
	matches: number;
	wins: number;
	losses: number;
	pins: number;
	techs: number;
	wlRatio: Ratio;
	winPercentage: number;
}

function reduce(frac: Ratio): Ratio {
    var a = frac[0];
    var b = frac[1];
    var c;
    while (b) {
        c = a % b; a = b; b = c;
    }
    return [frac[0] / a, frac[1] / a];
}

export default function Analysis({ wrestlers, bouts, identityPersonId }: AthleteDataProps) {
	const [stats, setStats] = React.useState<Stats>();

	React.useEffect(() => {
		console.log(wrestlers, bouts);
		if (wrestlers && bouts) {
			const stats: Stats = {
				matches: 0,
				wins: 0,
				losses: 0,
				pins: 0,
				techs: 0,
				wlRatio: [0, 0],
				winPercentage: 0,
			};

			bouts.data.forEach(bout => {
				stats.matches++;
				const topWrestler = wrestlers.data.find(w => w.id == bout.relationships.topWrestler.data.id);
				const bottomWrestler = wrestlers.data.find(w => w.id == bout.relationships.bottomWrestler.data.id);
				const winner = wrestlers.data.find(w => w.id == bout.attributes.winnerWrestlerId);

				const isAWin = winner?.attributes.identityPersonId == identityPersonId;
				
				stats.wins += +isAWin;
				stats.losses += +(winner?.attributes.identityPersonId != identityPersonId);
				stats.pins += +(isAWin && bout.attributes.winType == "F");
				stats.techs += +(isAWin && bout.attributes.winType == "TF");
			});

			stats.wlRatio = reduce([stats.wins, stats.losses]);
			stats.winPercentage = stats.wins / stats.matches;

			setStats(stats);
		}
	}, [wrestlers, bouts]);

	return stats ? (
		<Card p="xl" styles={{
			root: {
				gap: "1.5rem",
				justifyContent: "center",
				flexDirection: "row",
				flexWrap: "wrap",
			}
		}} m="lg">
			<Group gap={4}>
				<Text fw={600}>Matches:</Text>
				<Text>{stats?.matches}</Text>
			</Group>
			<Group gap={4}>
				<Text fw={600}>Wins:</Text>
				<Text c="green">{stats?.wins}</Text>
			</Group>
			<Group gap={4}>
				<Text fw={600}>Losses:</Text>
				<Text c="red">{stats?.losses}</Text>
			</Group>
			<Group gap={4}>
				<Text fw={600}>Pins:</Text>
				<Text>{stats?.pins}</Text>
			</Group>
			<Group gap={4}>
				<Text fw={600}>Techs:</Text>
				<Text>{stats?.techs}</Text>
			</Group>
			<Group gap={4}>
				<Text fw={600}>W/L Ratio:</Text>
				<Text c="green">{stats?.wlRatio[0]}</Text>
				<Text>-</Text>
				<Text c="red">{stats?.wlRatio[1]}</Text>
				<Text c={stats?.wlRatio[1] != 0 ? (stats?.wlRatio[0] / stats?.wlRatio[1] > 1 ? "green" : "red") : "green"}>({(stats?.wlRatio[1] != 0 ? (stats?.wlRatio[0] / stats?.wlRatio[1]) : stats?.wlRatio[0]).toFixed(2)})</Text>
			</Group>
			<Group gap={4}>
				<Text fw={600}>Win Percentage:</Text>
				<Text c={stats.winPercentage > 0.5 ? "green" : "red"}>{(stats?.winPercentage * 100).toFixed(1)}%</Text>
			</Group>
		</Card>
	) : (
		<Card>
			<Text>Loading...</Text>
		</Card>
	);
}