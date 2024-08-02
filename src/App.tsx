import "./App.css";
import "@mantine/core/styles.css";

import axios from "axios";

import { Button, Group, MantineProvider, Progress, SegmentedControl, Stack, TextInput } from "@mantine/core";
import React from "react";
import { useDisclosure } from "@mantine/hooks";
import FloURLS from "./FloURLS";
import SearchModal from "./components/SearchModal";
import { SearchResults } from "./api/response";

enum InputType {
	NAME = "Name",
	ID = "ID/Link",
}

const ID_REGEX = new RegExp("[0-9(a-f|A-F)]{8}-[0-9(a-f|A-F)]{4}-4[0-9(a-f|A-F)]{3}-[89ab][0-9(a-f|A-F)]{3}-[0-9(a-f|A-F)]{12}"); // UUID v4

const BOUTS_PER_PAGE = 10;

function App() {
	const searchButtonRef = React.useRef<HTMLButtonElement>(null);


	const [inputFocused, setInputFocused] = React.useState<boolean>(false);
	const [inputType, setInputType] = React.useState<InputType>(InputType.NAME);
	const [inputValue, setInputValue] = React.useState<string>("");
	const [inputError, setInputError] = React.useState<boolean>(false);

	const [downloadProgress, setDownloadProgress] = React.useState<number | null>(null); // from 0 to 100

	const [searchResults, setSearchResults] = React.useState<SearchResults | null>(null);

	const [searchModalOpened, { open: openSearchModal, close: closeSearchModal }] = useDisclosure();
	const [loading, { open: startLoading, close: stopLoading }] = useDisclosure();

	React.useEffect(() => {
		if (inputValue) setInputError(false);
	}, [inputValue]);

	React.useEffect(() => {
		if (inputFocused) setInputError(false);
	}, [inputFocused]);

	React.useEffect(() => {
		document.addEventListener("keypress", e => {
			if (e.key === "Enter" && inputFocused) searchButtonRef.current?.click();
		});
	});

	const searchFor = async (name: string) => {
		if (loading) return;

		startLoading();

		switch (inputType) {
			case InputType.NAME:
				console.log(`Searching by name: ${name}`);

				setDownloadProgress(0);

				const res = await axios.get(FloURLS.searchByName(name), {
					onDownloadProgress: e => {
						if (e.lengthComputable && e.total) {
							setDownloadProgress(e.loaded / e.total * 100);
						}
					},
				});

				setDownloadProgress(100);

				setSearchResults(res.data as SearchResults);
				openSearchModal();

				openSearchModal();

				break;
			case InputType.ID:
				const test = ID_REGEX.exec(inputValue);
				if (!test) {
					console.error("Invalid ID format");
					setInputError(true);
				} else {
					const id = test[0];

					console.log(`Downloading data for ID: ${id}`);

					stopLoading();
					await downloadData(id);
				}
				break;
		}

		stopLoading();
	};

	const downloadData = async (id: string) => {
		console.log(`Downloading data for ID: ${id}`);

		startLoading();

		try {
			const basicInfo = await axios.get(FloURLS.fetchBasicInfo(id));
			console.log(basicInfo);

			setDownloadProgress(0);

			const bouts = await axios.get(FloURLS.fetchBouts(id, BOUTS_PER_PAGE, 0));
			console.log("Downloaded bouts");
			setDownloadProgress(50);
			const placements = await axios.get(FloURLS.fetchPlacements(id), {
				onDownloadProgress: e => {
					if (e.lengthComputable && e.total) {
						console.log(`Placements: ${JSON.stringify(e)}`);
						setDownloadProgress(50 + (e.loaded / e.total * 50));
					}
				}
			});
			console.log("Downloaded placements");
			setDownloadProgress(100);

			console.log(basicInfo.data);
			console.log(bouts.data);
			console.log(placements.data);
		} catch (e) {
			console.error(e);
		}

		stopLoading();
		closeSearchModal();
	};

	return (
		<MantineProvider defaultColorScheme="light">
			<SearchModal searchTerm={inputValue} opened={searchModalOpened} results={searchResults} select={id => void downloadData(id)} close={closeSearchModal}/>
			<Stack>
				<Group justify="center">
					<SegmentedControl
						value={inputType}
						onChange={value => setInputType(value as InputType)}
						data={Object.values(InputType)}
						size="md"
					/>
					<TextInput
						value={inputValue}
						name={`wrestler-${inputType.toLowerCase()}`}
						onChange={e => setInputValue(e.currentTarget.value)}
						placeholder={`Enter ${inputType}...`}
						error={inputError}
						onFocus={() => setInputFocused(true)}
						onBlur={() => setInputFocused(false)}
						size="md"
					/>
					<Button
						variant="default"
						loading={loading}
						onClick={() => {
							if (!inputValue) {
								setInputError(true);
							} else {
								switch (inputType) {
									case InputType.NAME:
										void searchFor(inputValue);
										break;
									case InputType.ID:
										void downloadData(inputValue);
										break;
								}
							}
						}}
						ref={searchButtonRef}
						size="md"
					>Search</Button>
				</Group>
				<Progress value={downloadProgress ?? 100} />
			</Stack>
		</MantineProvider>
	);
}

export default App;
