import { Card, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { GradeObject } from "../api/types/objects/grade";
import { TeamAttributes } from "../api/types/objects/team";
import { BoutObject } from "../api/types/objects/bout";
import { Dayjs } from "dayjs";
import React from "react";

export type BasicInfo = {
	name: string;
	dateOfBirth?: Dayjs
	grade?: GradeObject;
	teams: {
		attributes: TeamAttributes;
		matches: BoutObject[];
	}[],
}

type Props = {
	info: BasicInfo;
	setIgnoredTeams: (teams: Set<string>) => void;
	reset: boolean;
	setReset: (reset: boolean) => void;
}

export default function GeneralInfoDisplay({ info, setIgnoredTeams, reset, setReset }: Props) {
	const [ignored, setIgnored] = React.useState<Set<string>>(new Set());

	React.useEffect(() => {
		console.log("info");
		setIgnored(new Set());
	}, [info]);

	React.useEffect(() => {
		if (reset) {
			console.log("setting ignored");
			setIgnored(new Set());
			setReset(false);
		}
	}, [reset]);

	React.useEffect(() => {
		console.log("ignored");
		setIgnoredTeams(ignored);
	}, [ignored]);

	return (
		<Card p="xl" styles={{
			root: {
				border: "1px solid var(--mantine-color-gray-7)",
				textAlign: "center",
			}
		}}>
			<Title order={3} style={{ marginBottom: 0 }}>{info.name}</Title>
			<Stack gap={1} mt="sm">
				<Stack m="md" gap={1}>
					<Group gap={4} justify="center">
						<Text size="md" fw={600}>Date of Birth: </Text>
						<Text size="md">{info.dateOfBirth ? info.dateOfBirth.format("MMMM D, YYYY") : "Unknown"}</Text>
					</Group>
					<Group gap={4} justify="center">
						<Text size="md" fw={600}>Grade: </Text>
						<Text size="md">{info.grade ? info.grade.attributes.name : "Unknown"}</Text>
					</Group>
				</Stack>
				<Stack gap="sm" justify="center">
					<Text size="md" fw={600}>Teams Wrestled For: </Text>
					<Group gap="lg" justify="center">
						{info.teams.map(team => (
							<Paper p="sm" withBorder key={team.attributes.identityTeamId} onClick={() => {
								if (team.attributes.identityTeamId) {
									if (ignored.has(team.attributes.identityTeamId)) {
										ignored.delete(team.attributes.identityTeamId);
									} else {
										ignored.add(team.attributes.identityTeamId);
									}
									console.log("setting ignored");
									setIgnored(new Set(ignored));
								}
							}} opacity={team.attributes.identityTeamId && ignored.has(team.attributes.identityTeamId) ? 0.5 : 1}>
								<Stack gap={2}>
									<Text size="md" fw="bold">{team.attributes.name}</Text>
									<Text size="sm">{team.attributes.location.name}</Text>
									<Text size="sm">{team.matches.length} matches</Text>
								</Stack>
							</Paper>
						))}
					</Group>
				</Stack>
			</Stack>
		</Card>
	);
}