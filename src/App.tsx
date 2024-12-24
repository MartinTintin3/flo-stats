import React from "react";
import { Button, CloseButtonProps, Group, MantineProvider, Stack, TableData, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { DateInput } from "@mantine/dates";
import { nprogress, NavigationProgress } from "@mantine/nprogress";

import SearchModal from "./components/SearchModal";

import { BoutsResponse, SearchResults, WrestlersResponse } from "./api/types/responses";
import FloAPI from "./api/FloAPI";
import { EventAttributes, EventObject } from "./api/types/objects/event";
import { WrestlerAttributes, WrestlerObject } from "./api/types/objects/wrestler";
import { BoutsIncludeAll, FloObject, NonNullableFields, WrestlersIncludeAll } from "./api/types/types";
import { WeightClassObject } from "./api/types/objects/weightClass";
import { BoutObject } from "./api/types/objects/bout";
import HighlightAndZoomLineChart from "./components/HighlightAndZoomLineChart";

import { IconReload } from "@tabler/icons-react";
import MatchesTable from "./components/MatchesTable";
import { AllBoutRelationships } from "./api/types/relationships";
import { useLocation, useParams } from "react-router";
import { ID_REGEX } from "./main";

function App() {
	const searchButtonRef = React.useRef<HTMLButtonElement>(null);

	const { id } = useParams();
	const location = useLocation();
	const [isLoaded, setIsLoaded] = React.useState<boolean>(false);

	const [inputFocused, setInputFocused] = React.useState<boolean>(false);
	const [inputValue, setInputValue] = React.useState<string>("");
	const [inputError, setInputError] = React.useState<boolean>(false);

	const [downloadProgress, setDownloadProgress] = React.useState<number | null>(null); // from 0 to 100

	const [searchResults, setSearchResults] = React.useState<SearchResults | null>(null);

	const [searchModalOpened, { open: openSearchModal, close: closeSearchModal }] = useDisclosure();
	const [loading, { open: startLoading, close: stopLoading }] = useDisclosure();

	const [wrestlers, setWrestlers] = React.useState<WrestlersResponse<void, Exclude<FloObject, WrestlerObject>> | null>(null);
	const [bouts, setBouts] = React.useState<BoutsResponse<AllBoutRelationships, Exclude<FloObject, BoutObject>> | null>(null);

	const [boutTables, setBoutTables] = React.useState<Record<string, TableData>>({});

	const [oldestBout, setOldestBout] = React.useState<Date | undefined>(undefined);
	const [newestBout, setNewestBout] = React.useState<Date | undefined>(undefined);

	const [athleteId, setAthleteId] = React.useState<string | null>(null);

	const [startDate, setStartDate] = React.useState<Date | null>(null);
	const [endDate, setEndDate] = React.useState<Date | null>(null);

	React.useEffect(() => {
		if (!isLoaded) {
			setIsLoaded(true);
			if (id) downloadData(id);
		}
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

		closeSearchModal();

		console.log(`Downloading data for ID: ${athleteId}`);

		setAthleteId(athleteId);

		startLoading();

		try {
			const start = performance.now();
			// Fetch all wrestler instances for athlete ID
			const wrestlersResponse = await FloAPI.fetchWrestlersByAthleteId<void, Exclude<FloObject, WrestlerObject>>(athleteId, {
				pageSize: 0,
				pageOffset: 0,
				onProgress: p => setDownloadProgress(p / 2),
			}, WrestlersIncludeAll);

			// Sort wrestler instances by event start date
			wrestlersResponse.data = wrestlersResponse.data.sort((a, b) => {
				return new Date((FloAPI.findIncludedObjectById<EventObject>(a.attributes.eventId, "event", wrestlersResponse)?.attributes as EventAttributes).startDateTime).getTime() - new Date((FloAPI.findIncludedObjectById(b.attributes.eventId, "event", wrestlersResponse)?.attributes as EventAttributes).startDateTime).getTime();
			});

			setWrestlers(wrestlersResponse);

			// Merge all recent wrestler data into one instance
			const everything = Object.assign({}, ...(wrestlersResponse.data.map(wrestler => { // Merge all wrestler data into one object
				return Object.fromEntries(Object.entries(wrestler.attributes).filter(([, v]) => v !== null)) as NonNullableFields<WrestlerAttributes>; // Remove null values
			}))) as NonNullableFields<WrestlerAttributes>;

			console.log(everything);

			// Fetch all bouts of athlete ID
			const boutsResponse = await FloAPI.fetchBouts<AllBoutRelationships, Exclude<FloObject, BoutObject>>(athleteId, {
				pageSize: 0,
				pageOffset: 0,
				onProgress: p => setDownloadProgress(p / 2 + 50),
			}, BoutsIncludeAll);

			setBouts(boutsResponse);

			window["bouts"] = boutsResponse;

			if (boutsResponse) {
				const oldest = boutsResponse.data.map(bout => new Date(bout.attributes.endDateTime ?? bout.attributes.goDateTime ?? Date.now())).reduce((a, b) => a < b ? a : b)
				const newest = boutsResponse.data.map(bout => new Date(bout.attributes.endDateTime ?? bout.attributes.goDateTime ?? Date.now())).reduce((a, b) => a > b ? a : b)
				setOldestBout(oldest);
				setNewestBout(newest);

				setStartDate(oldest);
				setEndDate(newest);

				console.log(`Oldest bout: ${oldest}, Newest bout: ${newest}`);
			}

			console.log(((performance.now() - start) / 1000).toFixed(2) + "s");

			console.log(wrestlers, bouts);
		} catch (e) {
			console.error(e);
		}

		stopLoading();
	};

	return (
		<MantineProvider defaultColorScheme="dark">
			<NavigationProgress />
			<SearchModal searchTerm={inputValue} opened={searchModalOpened} results={searchResults} select={id => void downloadData(id)} close={closeSearchModal}/>
			<Stack>
				<Group justify="center">
					<DateInput
						label="Filter Start Date"
						placeholder="Pick date"
						value={startDate}
						minDate={oldestBout}
						maxDate={newestBout}
						clearable
						clearButtonProps={{ onClick: () => oldestBout ? setStartDate(oldestBout): {}, icon: <IconReload size={16} />  } as CloseButtonProps as never}
						onChange={setStartDate}
					/>
					<DateInput
						label="Filter End Date"
						placeholder="Pick date"
						value={endDate}
						minDate={oldestBout}
						maxDate={newestBout}
						clearable
						clearButtonProps={{ onClick: () => newestBout ? setEndDate(newestBout): {}, icon: <IconReload size={16} />  } as CloseButtonProps as never}
						onChange={setEndDate}
					/>
				</Group>
				{wrestlers && athleteId ? (
					<MatchesTable athleteId={athleteId} bouts={bouts} startDate={startDate} endDate={endDate} />
				) : null}
				{/*wrestlers ? (
					<Stack>
						<Title order={2}>Weight Chart</Title>
						<HighlightAndZoomLineChart h={400} data={wrestlers as WrestlersResponse<void, WeightClassObject>} startDate={startDate} endDate={endDate} />
					</Stack>
				) : null*/}
			</Stack>
		</MantineProvider>
	);
}

export default App;
