import React from "react";
import { Button, Checkbox, CloseButtonProps, Group, MantineProvider, Overlay, Stack, TableData, Tabs, TextInput, Title } from "@mantine/core";
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

import CarouselFloatingIndicators from "./components/CarouselFloatingIndicators";
import PlacementsDisplay from "./components/PlacementsDisplay";
import dayjs from "dayjs";
import GeneralInfoDisplay from "./components/GeneralInfoDisplay";
import { TeamObject } from "./api/types/objects/team";

import styles from "./Athletes.module.css";
import BoutDateFilter from "./components/BoutDateFilter";
import { GradeObject } from "./api/types/objects/grade";

export default function Athletes() {
	const { id } = useParams();

	const [downloading, setDownloading] = React.useState<boolean>(false);

	const [wrestlers, setWrestlers] = React.useState<WrestlersResponse<AllWrestlerRelationships, Exclude<FloObject, WrestlerObject>> | null>(null);
	const [bouts, setBouts] = React.useState<BoutsResponse<AllBoutRelationships, Exclude<FloObject, BoutObject>> | null>(null);

	const [filteredWrestlers, setFilteredWrestlers] = React.useState<WrestlersResponse<AllWrestlerRelationships, Exclude<FloObject, WrestlerObject>> | null>(null);
	const [filteredBouts, setFilteredBouts] = React.useState<BoutsResponse<AllBoutRelationships, Exclude<FloObject, BoutObject>> | null>(null);

	const [oldestBout, setOldestBout] = React.useState<Date | undefined>(undefined);
	const [newestBout, setNewestBout] = React.useState<Date | undefined>(undefined);

	const [downloadingFor, setDownloadingFor] = React.useState<string | null>(null);

	const [athleteId, setAthleteId] = React.useState<string | null>(null);

	const [startDate, setStartDate] = React.useState<Date | null>(null);
	const [endDate, setEndDate] = React.useState<Date | null>(null);

	const [filter, setFilter] = React.useState({
		eventType: {
			tournaments: true,
			duals: true,
		},
		byes: true,
		forfeits: true,
	});

	React.useEffect(() => {
		if (bouts) {
			let total = 0;
			setFilteredBouts({
				data: bouts.data.filter(bout => {
					const date = dayjs(bout.attributes.goDateTime ?? bout.attributes.endDateTime ?? FloAPI.findIncludedObjectById<EventObject>(bout.attributes.eventId, "event", bouts)?.attributes.startDateTime);
					if (startDate && date.isBefore(dayjs(startDate))) return false;
					if (endDate && date.isAfter(dayjs(endDate))) return false;
					if (bout.attributes.winType == "BYE" && !filter.byes) return false;
					if (bout.attributes.winType == "FOR" && !filter.forfeits) return false
					const event = FloAPI.findIncludedObjectById<EventObject>(bout.attributes.eventId, "event", bouts);
					if (event?.attributes.isDual && !filter.eventType.duals) return false;
					if (!event?.attributes.isDual && !filter.eventType.tournaments) return false;

					total++;
					return true;
				}),
				included: bouts.included,
				meta: { total },
				links: bouts.links,
			});
		}
		if (wrestlers) {
			let total = 0;
			setFilteredWrestlers({
				data: wrestlers.data.filter(wrestler => {
					const event = FloAPI.findIncludedObjectById<EventObject>(wrestler.attributes.eventId, "event", wrestlers);
					const date = dayjs(event?.attributes.endDateTime ?? event?.attributes.startDateTime);
					if (startDate && date.isBefore(dayjs(startDate))) return false;
					if (endDate && date.isAfter(dayjs(endDate))) return false;
					if (!filter.eventType.duals && event?.attributes.isDual) return false;
					if (!filter.eventType.tournaments && !event?.attributes.isDual) return false;

					total++;
					return true;
				}),
				included: wrestlers.included.filter(i => {
					if (i.type == "bracketPlacement") {
						const event = FloAPI.findIncludedObjectById<EventObject>(i.attributes.eventId, "event", wrestlers);

						if (event?.attributes.isDual && !filter.eventType.duals) return false;
						if (!event?.attributes.isDual && !filter.eventType.tournaments) return false;
					}

					return true;
				}),
				meta: { total },
				links: wrestlers.links,
			});
		}
	}, [startDate, endDate, filter]);

	const [basicInfo, setBasicInfo] = React.useState<{
		name: string;
		grade?: GradeObject;
		team?: TeamObject;
	} | null>(null);

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

			wrestlersResponse.data.sort((a, b) => {
				const aEvent = FloAPI.findIncludedObjectById<EventObject>(a.attributes.eventId, "event", wrestlersResponse);
				const bEvent = FloAPI.findIncludedObjectById<EventObject>(b.attributes.eventId, "event", wrestlersResponse);

				const aDate = aEvent?.attributes.endDateTime ?? aEvent?.attributes.startDateTime;
				const bDate = bEvent?.attributes.endDateTime ?? bEvent?.attributes.startDateTime;

				return dayjs(aDate).isBefore(dayjs(bDate)) ? 1 : dayjs(aDate).isAfter(dayjs(bDate)) ? -1 : 0;
			});

			nprogress.set(50);

			setWrestlers(wrestlersResponse);

			// Fetch all bouts of athlete ID
			const boutsResponse = await FloAPI.fetchBouts<AllBoutRelationships, Exclude<FloObject, BoutObject>>(i, {
				pageSize: 0,
				pageOffset: 0,
				onProgress: p => nprogress.set(p / 2 + 50),
			}, BoutsIncludeAll);

			setBasicInfo({
				name: wrestlersResponse.data[0].attributes.firstName + " " + wrestlersResponse.data[0].attributes.lastName,
				grade: wrestlersResponse.data.find(w => w.attributes.grade)?.attributes.grade,
				team: wrestlersResponse.data.find(w => w.attributes.teamId)?.attributes.teamId ? FloAPI.findIncludedObjectById<TeamObject>(wrestlersResponse.data.find(w => w.attributes.teamId)?.attributes.teamId as string, "team", wrestlersResponse) : undefined,
			});

			setBouts(boutsResponse);

			setAthleteId(i);
			setDownloading(false);

			window["bouts"] = boutsResponse;

			if (boutsResponse && boutsResponse.data.length) {
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
		<Stack>
			{downloading ? <Overlay backgroundOpacity={0} blur={2} h={"100%"} fixed={true} /> : null}
			<BoutDateFilter startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} oldestBout={oldestBout} newestBout={newestBout} />
			<Stack gap="sm" mb="md">
				<Group content="center">
					<Checkbox checked={filter.eventType.duals} label="Duals" onChange={e => {
						if (!e.target.checked) {
							setFilter({ ...filter, eventType: { ...filter.eventType, duals: false, tournaments: true } })
						} else {
							setFilter({ ...filter, eventType: { ...filter.eventType, duals: true } })
						}
					}} />
					<Checkbox checked={filter.eventType.tournaments} label="Tournaments" onChange={e => {
						if (!e.target.checked) {
							setFilter({ ...filter, eventType: { ...filter.eventType, tournaments: false, duals: true } })
						} else {
							setFilter({ ...filter, eventType: { ...filter.eventType, tournaments: true } })
						}
					}} />
				</Group>
				<Group>
					<Checkbox checked={filter.byes} label="Byes" onChange={e => setFilter({ ...filter, byes: e.target.checked })} />
					<Checkbox checked={filter.forfeits} label="Forfeits" onChange={e => setFilter({ ...filter, forfeits: e.target.checked })} />
				</Group>
			</Stack>
			{wrestlers && athleteId ? (
				<Stack align="center">
					<Tabs defaultValue="matches">
						<Tabs.List justify="center">
							<Tabs.Tab value="matches">Matches</Tabs.Tab>
							<Tabs.Tab value="placements">Placements</Tabs.Tab>
						</Tabs.List>
						<Tabs.Panel value="matches">
							<MatchesTable athleteId={athleteId} bouts={filteredBouts} />
						</Tabs.Panel>
						<Tabs.Panel value="placements">
							<PlacementsDisplay athleteId={athleteId} wrestlers={filteredWrestlers} />
						</Tabs.Panel>
					</Tabs>
					{/*<CarouselFloatingIndicators indicators={["Matches", "Placements"]} active={activeTab} setActive={i => { embla?.scrollTo(i); setActiveTab(i) }}/>
					<Carousel withControls={false} getEmblaApi={setEmbla}>
						<Carousel.Slide>
							<MatchesTable athleteId={athleteId} bouts={bouts} startDate={startDate} endDate={endDate} />
						</Carousel.Slide>
						<Carousel.Slide>
							<PlacementsDisplay athleteId={athleteId} wrestlers={wrestlers} startDate={startDate} endDate={endDate} />
						</Carousel.Slide>
					</Carousel>*/}
				</Stack>
			) : null}
			{/*wrestlers ? (
				<Stack>
					<Title order={2}>Weight Chart</Title>
					<HighlightAndZoomLineChart h={400} data={wrestlers as WrestlersResponse<void, WeightClassObject>} startDate={startDate} endDate={endDate} />
				</Stack>
			) : null*/}
		</Stack>
	);
}