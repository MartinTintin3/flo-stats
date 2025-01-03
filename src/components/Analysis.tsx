import React from "react";
import { Accordion, Card, CardProps, Flex, Group, PolymorphicComponentProps, Text, Title, useProps } from "@mantine/core";
import { AthleteDataProps } from "../Athletes";
import { RadarChart } from "@mantine/charts";

type Ratio = [number, number];

type Stats = {
	matches: number;
	wins: number;
	losses: number;
	pins: number;
	techs: number;
	wlRatio: Ratio;
	winPercentage: number;
	finishTypes: { type: string, wins: number, losses: number }[];
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

export default function Analysis(props: AthleteDataProps & { children?: React.ReactNode } & CardProps) {
	const { wrestlers, bouts, identityPersonId, children } = props;
	const stats = React.useMemo(() => {
		if (wrestlers && bouts) {
			const stats: Stats = {
				matches: 0,
				wins: 0,
				losses: 0,
				pins: 0,
				techs: 0,
				wlRatio: [0, 0],
				winPercentage: 0,
				finishTypes: [],
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

				const finish = stats.finishTypes.find(f => f.type == bout.attributes.winType);
				if (finish) {
					finish.wins += +isAWin;
					finish.losses += +!isAWin;
				} else {
					stats.finishTypes.push({ type: bout.attributes.winType, wins: +isAWin, losses: +!isAWin });
				}
			});

			stats.wlRatio = reduce([stats.wins, stats.losses]);
			stats.winPercentage = stats.wins / stats.matches;

			return stats;
		}
	}, [wrestlers, bouts]);

	return stats ? (
		<Card p="0" bg="var(--mantine-color-dark-7)" bd="1px solid var(--mantine-color-gray-7)" w="100%" {...props}>
			<Flex gap="lg" justify="center" direction="row" wrap="wrap">
				<Group gap={4}>
					<Text fw={600}>Matches:</Text>
					<Text>{stats.matches}</Text>
				</Group>
				<Group gap={4}>
					<Text fw={600}>Wins:</Text>
					<Text c="green">{stats.wins}</Text>
				</Group>
				<Group gap={4}>
					<Text fw={600}>Losses:</Text>
					<Text c="red">{stats.losses}</Text>
				</Group>
				<Group gap={4}>
					<Text fw={600}>Pins:</Text>
					<Text>{stats.pins}</Text>
				</Group>
				<Group gap={4}>
					<Text fw={600}>Techs:</Text>
					<Text>{stats.techs}</Text>
				</Group>
				<Group gap={4}>
					<Text fw={600}>W/L Ratio:</Text>
					<Text c="green">{stats.wlRatio[0]}</Text>
					<Text>-</Text>
					<Text c="red">{stats.wlRatio[1]}</Text>
					<Text c={stats.wlRatio[1] != 0 ? (stats.wlRatio[0] / stats.wlRatio[1] > 1 ? "green" : "red") : "green"}>({(stats.wlRatio[1] != 0 ? (stats.wlRatio[0] / stats.wlRatio[1]) : stats.wlRatio[0]).toFixed(2)})</Text>
				</Group>
				<Group gap={4}>
					<Text fw={600}>Win Percentage:</Text>
					<Text c={stats.winPercentage > 0.5 ? "green" : "red"}>{(stats.winPercentage * 100).toFixed(1)}%</Text>
				</Group>
			</Flex>
			<Accordion variant="default">
				<Accordion.Item value="Statistics" style={{ borderBottom: "none" }}>
					<Accordion.Control ta="center">
						<Title order={3}>See More</Title>
					</Accordion.Control>
					<Accordion.Panel>
						<RadarChart
							h={300}
							w={300}
							data={stats.finishTypes}
							dataKey="type"	
							withPolarAngleAxis
							withPolarRadiusAxis
							series={[
								{ name: "wins", color: "green", opacity: 0.2 },
								{ name: "losses", color: "red", opacity: 0.2 },
							]}
							polarRadiusAxisProps={{
								scale: "sqrt",
							}}
						/>
						{children}
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>
		</Card>
	) : (
		<Card>
			<Text>Loading...</Text>
		</Card>
	);
}
