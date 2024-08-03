import { Button, Flex, Modal, ScrollArea, Text, Title } from "@mantine/core";
import { SearchResults } from "../api/types/responses";
import dayjs from "dayjs";

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
								h="auto"
								variant="default"
								style={{
									flexBasis: "100%",
									padding: "0.5rem",
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
									<Title order={3}>{result.title}</Title>
									{new Array<{ label: string, value: string }>(...[
										{ label: "Gender", value: result.gender ? (result.gender == "f" ? "Female" : "Male") : "N/A" },
										{ label: "Birth Date", value: result.birth_date ? dayjs(result.birth_date).format("MM/DD/YYYY") : "N/A" },
										{ label: "HS Graduation", value: result.high_scrool_grad_year ? result.high_scrool_grad_year.toString() : "N/A" },
										{ label: "Location", value: result.location ? result.location.name : "N/A" },
									]).map(({ label, value }) => (
										<Text span
											style={{
												display: "inline-flex",
												justifyContent: "center",
												gap: "0.2rem",
											}}
										>
											<Text fw={700}>{label}:</Text>
											<Text>{value}</Text>
										</Text>
									))}
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