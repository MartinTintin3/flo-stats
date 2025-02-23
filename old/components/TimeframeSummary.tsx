import { Stack, Tabs, Title } from "@mantine/core";
import Analysis from "./Analysis";
import MatchesTable from "./MatchesTable";
import PlacementsDisplay from "./PlacementsDisplay";
import { AthleteDataProps } from "../Athletes";

export default function TimeframeSummary(props: AthleteDataProps & { title: string }) {
	return (
		<Stack align="center" w="100%">
			<Title order={2}>{props.title}</Title>
			<Analysis mx="lg" {...props}>
				<Tabs defaultValue="matches" w="100%">
					<Tabs.List justify="center">
						<Tabs.Tab value="matches">Matches</Tabs.Tab>
						<Tabs.Tab value="placements">Placements</Tabs.Tab>
					</Tabs.List>
					<Tabs.Panel value="matches" styles={{ panel: { overflow: "auto" } }}>
						<MatchesTable {...props} />
					</Tabs.Panel>
					<Tabs.Panel value="placements">
						<PlacementsDisplay {...props} />
					</Tabs.Panel>
				</Tabs>
			</Analysis>
		</Stack>
	)
}