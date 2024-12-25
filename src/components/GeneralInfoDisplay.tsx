import { Card, Stack, Text, Title } from "@mantine/core";
import { GradeObject } from "../api/types/objects/grade";
import { TeamObject } from "../api/types/objects/team";

export type BasicInfo = {
	name: string;
	grade?: GradeObject;
	team?: TeamObject;
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
				<Text size="md">Team: {info.team ? info.team.attributes.name : "Unaffiliated"}</Text>
			</Stack>
		</Card>
	)
}