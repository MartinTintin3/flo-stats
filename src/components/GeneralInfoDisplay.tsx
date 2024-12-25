import { JsonInput, Stack, Title } from "@mantine/core";
import { WrestlerAttributes, WrestlerObject } from "../api/types/objects/wrestler";
import { NonNullableFields } from "../api/types/types"

type Props = {
	wrestler: NonNullableFields<WrestlerAttributes>;
}

export default function GeneralInfoDisplay({ wrestler }: Props) {
	return (
		<Stack>
			<Title order={3} style={{ marginBottom: 0 }}>{wrestler.firstName} {wrestler.lastName}</Title>
			<Title order={4} style={{ marginBottom: 0 }}>{JSON.stringify(wrestler.grade)}</Title>
		</Stack>
	)
}