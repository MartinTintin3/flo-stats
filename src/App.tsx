import "./App.css";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/nprogress/styles.css";

import React from "react";
import { Button, Group, MantineProvider, Stack, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import { nprogress, NavigationProgress } from "@mantine/nprogress";

import SearchModal from "./components/SearchModal";
import WeightChart from "./components/WeightChart";

import { BoutsResponse, SearchResults, WrestlersResponse } from "./api/types/responses";
import FloAPI from "./api/FloAPI";
import { EventAttributes, EventObject } from "./api/types/objects/event";
import { WrestlerAttributes, WrestlerObject } from "./api/types/objects/wrestler";
import { BoutsIncludeAll, FloObject, NonNullableFields, WrestlersIncludeAll } from "./api/types/types";
import { WeightClassObject } from "./api/types/objects/weightClass";
import { BoutObject } from "./api/types/objects/bout";

const ID_REGEX = new RegExp("[0-9(a-f|A-F)]{8}-[0-9(a-f|A-F)]{4}-4[0-9(a-f|A-F)]{3}-[89ab][0-9(a-f|A-F)]{3}-[0-9(a-f|A-F)]{12}"); // UUID v4

function App() {
	const searchButtonRef = React.useRef<HTMLButtonElement>(null);

	const [inputFocused, setInputFocused] = React.useState<boolean>(false);
	const [inputValue, setInputValue] = React.useState<string>("");
	const [inputError, setInputError] = React.useState<boolean>(false);

	const [downloadProgress, setDownloadProgress] = React.useState<number | null>(null); // from 0 to 100

	const [searchResults, setSearchResults] = React.useState<SearchResults | null>(null);

	const [searchModalOpened, { open: openSearchModal, close: closeSearchModal }] = useDisclosure();
	const [loading, { open: startLoading, close: stopLoading }] = useDisclosure();

	const [wrestlers, setWrestlers] = React.useState<WrestlersResponse<void, Exclude<FloObject, WrestlerObject>> | null>(null);
	const [bouts, setBouts] = React.useState<BoutsResponse<void, Exclude<FloObject, BoutObject>> | null>(null);

	const [, setAthleteId] = React.useState<string | null>(null);

	const [startDate, setStartDate] = React.useState<Date | null>(null);
	const [endDate, setEndDate] = React.useState<Date | null>(null);

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

	React.useEffect(() => {
		if (downloadProgress == 100) {
			nprogress.complete();
		} else if (downloadProgress !== null) {
			nprogress.set(downloadProgress);
		} else {
			nprogress.reset();
		}
	}, [downloadProgress]);

	const searchFor = async (name: string) => {
		if (loading) return;

		console.log(`Searching for name: ${name}`);

		startLoading();

		setDownloadProgress(0);

		const req = await FloAPI.searchByName(name, {
			onDownloadProgress: e => {
				if (e.lengthComputable && e.total) {
					setDownloadProgress(e.loaded / e.total * 100);
				}
			},
		});

		setDownloadProgress(100);

		setSearchResults(req.data);
		openSearchModal();

		openSearchModal();

		stopLoading();
	};

	const downloadData = async (athleteId: string) => {
		if (loading) return;

		console.log(`Downloading data for ID: ${athleteId}`);

		setAthleteId(athleteId);

		startLoading();

		try {
			const start = performance.now();
			const wrestlersResponse = await FloAPI.fetchWrestlersByAthleteId<void, Exclude<FloObject, WrestlerObject>>(athleteId, {
				pageSize: 0,
				pageOffset: 0,
				onProgress: p => setDownloadProgress(p / 2),
			}, WrestlersIncludeAll);

			wrestlersResponse.data = wrestlersResponse.data.sort((a, b) => {
				return new Date((FloAPI.findIncludedObjectById<EventObject>(a.attributes.eventId, "event", wrestlersResponse)?.attributes as EventAttributes).startDateTime).getTime() - new Date((FloAPI.findIncludedObjectById(b.attributes.eventId, "event", wrestlersResponse)?.attributes as EventAttributes).startDateTime).getTime();
			});

			setWrestlers(wrestlersResponse);

			const everything = Object.assign({}, ...(wrestlersResponse.data.map(wrestler => { // Merge all wrestler data into one object
				return Object.fromEntries(Object.entries(wrestler.attributes).filter(([, v]) => v !== null)) as NonNullableFields<WrestlerAttributes>; // Remove null values
			}))) as NonNullableFields<WrestlerAttributes>;

			console.log(everything);

			const boutsResponse = await FloAPI.fetchBouts<void, Exclude<FloObject, BoutObject>>(athleteId, {
				pageSize: 0,
				pageOffset: 0,
				onProgress: p => setDownloadProgress(p / 2 + 50),
			}, BoutsIncludeAll);

			setBouts(boutsResponse);

			console.log(((performance.now() - start) / 1000).toFixed(2) + "s");

			console.log(wrestlers, bouts);
		} catch (e) {
			console.error(e);
		}

		stopLoading();
		closeSearchModal();
	};

	return (
		<MantineProvider defaultColorScheme="light">
			<NavigationProgress />
			<SearchModal searchTerm={inputValue} opened={searchModalOpened} results={searchResults} select={id => void downloadData(id)} close={closeSearchModal}/>
			<Stack>
				<Group justify="center">
					<TextInput
						value={inputValue}
						name="wrestler-search"
						onChange={e => setInputValue(e.currentTarget.value)}
						placeholder="Enter name or ID..."
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
								const test = ID_REGEX.exec(inputValue);
								if (!test) {
									void searchFor(inputValue);
								} else {
									void downloadData(test[0]);
								}
							}
						}}
						ref={searchButtonRef}
						size="md"
					>Search</Button>
				</Group>
				<Group justify="center">
					<DateInput
						label="Filter Start Date"
						placeholder="Pick date"
						value={startDate}
						onChange={setStartDate}
					/>
					<DateInput
						label="Filter End Date"
						placeholder="Pick date"
						value={endDate}
						onChange={setEndDate}
					/>
				</Group>
				{wrestlers ? (
					<Stack>
						<Title order={2}>Weight Chart</Title>
						<WeightChart h={400} data={wrestlers as WrestlersResponse<void, WeightClassObject>} startDate={startDate} endDate={endDate} />
					</Stack>
				) : null}
			</Stack>
		</MantineProvider>
	);
}

export default App;
