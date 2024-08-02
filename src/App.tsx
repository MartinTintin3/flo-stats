import "./App.css";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/nprogress/styles.css";

import { Button, Group, MantineProvider, Stack, TextInput } from "@mantine/core";
import React from "react";
import { useDisclosure } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import { nprogress, NavigationProgress } from "@mantine/nprogress";

import SearchModal from "./components/SearchModal";
import WeightChart from "./components/WeightChart";

import { SearchResults, WrestlersResponse } from "./api/types/responses";
import FloAPI from "./api/FloAPI";
import { EventAttributes, EventObject } from "./api/types/objects/event";
import { EventRelationship, WeightClassRelationship } from "./api/types/relationships";
import { WeightClassObject } from "./api/types/objects/weightClass";
import { WrestlerAttributes } from "./api/types/objects/wrestler";
import { NonNullableFields, WrestlersIncludeAll } from "./api/types/types";

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

	const [wrestlersResponse, setWrestlersResponse] = React.useState<WrestlersResponse<EventRelationship & WeightClassRelationship, EventObject | WeightClassObject> | null>(null);

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

		startLoading();

		try {
			const basicInfo = (await FloAPI.fetchWrestlersByAthleteId<EventRelationship & WeightClassRelationship, EventObject | WeightClassObject>(athleteId, { pageSize: 0, pageOffset: 0 }, {
				onDownloadProgress: e => {
					console.log(e);
				},
			}, WrestlersIncludeAll)).data;

			basicInfo.data = basicInfo.data.sort((a, b) => {
				return new Date((FloAPI.findIncludedObjectById(a.attributes.eventId, "event", basicInfo)?.attributes as EventAttributes).startDateTime).getTime() - new Date((FloAPI.findIncludedObjectById(b.attributes.eventId, "event", basicInfo)?.attributes as EventAttributes).startDateTime).getTime();
			});

			setWrestlersResponse(basicInfo);

			console.log(basicInfo.data.map(wrestler => {
				const event = FloAPI.findIncludedObjectById(wrestler.relationships.event.data.id, "event", basicInfo)?.attributes as EventAttributes;
				return [event.isDual, event.name];
			}));

			const everything = Object.assign({}, ...(basicInfo.data.map(wrestler => { // Merge all wrestler data into one object
				return Object.fromEntries(Object.entries(wrestler.attributes).filter(([, v]) => v !== null)) as NonNullableFields<WrestlerAttributes>; // Remove null values
			}))) as NonNullableFields<WrestlerAttributes>;

			console.log(everything);

			setDownloadProgress(0);

			/*const bouts = await axios.get(FloURLS.fetchBouts(id, BOUTS_PER_PAGE, 0));
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
			console.log(placements.data);*/
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
				<Group>
					<Stack>
						<DateInput
							label="Chart Start Date"
							placeholder="Pick date"
							value={startDate}
							onChange={setStartDate}
						/>
						<DateInput
							label="Chart End Date"
							placeholder="Pick date"
							value={endDate}
							onChange={setEndDate}
						/>
					</Stack>
					{wrestlersResponse ? <WeightChart h={400} data={wrestlersResponse} startDate={startDate} endDate={endDate} /> : null}
				</Group>
			</Stack>
		</MantineProvider>
	);
}

export default App;
