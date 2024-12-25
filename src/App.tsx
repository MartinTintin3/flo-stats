import React from "react";
import { Button, CloseButtonProps, Group, MantineProvider, Overlay, Stack, TableData, Tabs, TextInput, Title } from "@mantine/core";
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
import { AllBoutRelationships, AllWrestlerRelationships } from "./api/types/relationships";
import { useLocation, useParams } from "react-router";
import { ID_REGEX } from "./main";

import { Carousel, Embla } from "@mantine/carousel";

import styles from "./App.module.css";
import CarouselFloatingIndicators from "./components/CarouselFloatingIndicators";
import PlacementsDisplay from "./components/PlacementsDisplay";

function App() {
	const { id } = useParams();

	const [downloading, setDownloading] = React.useState<boolean>(false);

	const [wrestlers, setWrestlers] = React.useState<WrestlersResponse<AllWrestlerRelationships, Exclude<FloObject, WrestlerObject>> | null>(null);
	const [bouts, setBouts] = React.useState<BoutsResponse<AllBoutRelationships, Exclude<FloObject, BoutObject>> | null>(null);

	const [oldestBout, setOldestBout] = React.useState<Date | undefined>(undefined);
	const [newestBout, setNewestBout] = React.useState<Date | undefined>(undefined);

	const [downloadingFor, setDownloadingFor] = React.useState<string | null>(null);

	const [athleteId, setAthleteId] = React.useState<string | null>(null);

	const [startDate, setStartDate] = React.useState<Date | null>(null);
	const [endDate, setEndDate] = React.useState<Date | null>(null);

	const [embla, setEmbla] = React.useState<Embla | null>(null);
	const [activeTab, setActiveTab] = React.useState<number>(0);

	React.useEffect(() => {
		if (athleteId !== id && id) {
			downloadData(id);
		}
	}, [id]);

	React.useEffect(() => {
		if (embla) {
			embla.on("scroll", () => {
				setActiveTab(embla.selectedScrollSnap());
			});
		}
	}, [embla]);


	const downloadData = async (i: string) => {
		if (i == athleteId || i == downloadingFor) return;
		console.log(i, athleteId, downloadingFor);

		setDownloadingFor(i);
		setDownloading(true);

		try {
			const start = performance.now();
			nprogress.start();
			// Fetch all wrestler instances for athlete ID
			const wrestlersResponse = await FloAPI.fetchWrestlersByAthleteId<AllWrestlerRelationships, Exclude<FloObject, WrestlerObject>>(i, {
				pageSize: 0,
				pageOffset: 0,
				onProgress: p => nprogress.set(p / 2),
			}, WrestlersIncludeAll);

			nprogress.set(50);

			setWrestlers(wrestlersResponse);

			// Merge all recent wrestler data into one instance
			const everything = Object.assign({}, ...(wrestlersResponse.data.map(wrestler => { // Merge all wrestler data into one object
				return Object.fromEntries(Object.entries(wrestler.attributes).filter(([, v]) => v !== null)) as NonNullableFields<WrestlerAttributes>; // Remove null values
			}))) as NonNullableFields<WrestlerAttributes>;

			// Fetch all bouts of athlete ID
			const boutsResponse = await FloAPI.fetchBouts<AllBoutRelationships, Exclude<FloObject, BoutObject>>(i, {
				pageSize: 0,
				pageOffset: 0,
				onProgress: p => nprogress.set(p / 2 + 50),
			}, BoutsIncludeAll);

			setBouts(boutsResponse);

			setAthleteId(i);
			setDownloading(false);

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

			nprogress.complete();

			console.log(((performance.now() - start) / 1000).toFixed(2) + "s");
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<MantineProvider defaultColorScheme="dark">
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
				{downloading ? <Overlay backgroundOpacity={0} blur={2} h={"100%"} fixed={true} /> : null}
				{wrestlers && athleteId ? (
					<Stack align="center">
						<CarouselFloatingIndicators indicators={["Matches", "Placements"]} active={activeTab} setActive={i => { embla?.scrollTo(i); setActiveTab(i) }}/>
						<Carousel withControls={false} getEmblaApi={setEmbla}>
							<Carousel.Slide>
								<MatchesTable athleteId={athleteId} bouts={bouts} startDate={startDate} endDate={endDate} />
							</Carousel.Slide>
							<Carousel.Slide>
								<PlacementsDisplay athleteId={athleteId} wrestlers={wrestlers} startDate={startDate} endDate={endDate} />
							</Carousel.Slide>
						</Carousel>
					</Stack>
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
