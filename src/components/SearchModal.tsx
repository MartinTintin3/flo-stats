import { Button, Flex, Modal, ScrollArea, Text, Title } from "@mantine/core";
import { SearchResults } from "../api/types/responses";

type SearchModalProps = {
	searchTerm: string;
	results: SearchResults | null;
	opened: boolean;
	close: () => void;
	select: (id: string) => void;
};

export default function SearchModal({ searchTerm, results, opened, close, select }: SearchModalProps) {
	return (
		<Modal
			opened={opened}
			onClose={close}
			removeScrollProps={{ allowPinchZoom: true }}
			title={`Results for "${searchTerm}"`}
			size="md"
			scrollAreaComponent={ScrollArea.Autosize}
			styles={{
				title: {
					fontSize: "var(--mantine-font-size-xl)",
				}
			}}
		>
			{results ? results.data ? (
				<>
					<Flex
						direction="row"
						wrap="wrap"
						gap="10"
					>
						{results.data.map(result => (
							<Button
								h={100}
								variant="default"
								style={{
									flexBasis: "100%",
								}}
								key={result.arena_person_identity_id}
								onClick={() => {
									close();
									select(result.arena_person_identity_id);
								}}
							>
								<Flex
									style={{
										flexDirection: "column",
									}}
								>
									<Title order={3}>{result.name}</Title>
									<Text span
										style={{
											display: "inline-flex",
											justifyContent: "center",
											gap: "0.2rem",
										}}
									>
										<Text fw={700}>Location: </Text>
										<Text>{result.location.name}</Text>
									</Text>
								</Flex>
							</Button>
						))}
					</Flex>
				</>
			) : (
				<div>No results found</div>
			) : (
				<div>Loading...</div>
			)}
		</Modal>
	);
}