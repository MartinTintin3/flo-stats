import { Card, Stack, Text, Title } from "@mantine/core";
import { GradeObject } from "../api/types/objects/grade";
import { TeamAttributes, TeamObject } from "../api/types/objects/team";
import { BoutObject } from "../api/types/objects/bout";

export type BasicInfo = {
	name: string;
	grade?: GradeObject;
	teams: {
		attributes: TeamAttributes;
		matches: BoutObject[];
	}[],
}

type Props = {
	info: BasicInfo;
}

export default function GeneralInfoDisplay({ info }: Props) {
	return (
		<Card p="xl" styles={{
			root: {
				border: "1px solid var(--mantine-color-gray-7)",
			}
		}}>
			<Title order={4} style={{ marginBottom: 0 }}>{info.name}</Title>
			<Stack gap="sm">
				<Text size="md">{info.grade ? info.grade.attributes.name : "Ungraded"}</Text>
				{info.teams.map(team => (
					<Stack key={team.attributes.identityTeamId} gap="sm">
						<Text size="md">{team.attributes.name}</Text>
						<Text size="sm">{team.matches.length} matches</Text>
					</Stack>
				))}
			</Stack>
		</Card>
	);
}