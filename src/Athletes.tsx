import React from "react";
import { Checkbox, Group, Overlay, Stack, Tabs } from "@mantine/core";
import { nprogress } from "@mantine/nprogress";


import { BoutsResponse, WrestlersResponse } from "./api/types/responses";
import FloAPI from "./api/FloAPI";
import { EventObject } from "./api/types/objects/event";
import { WrestlerObject } from "./api/types/objects/wrestler";
import { BoutsIncludeAll, FloObject, WrestlersIncludeAll } from "./api/types/types";
import { BoutObject } from "./api/types/objects/bout";

import { AllBoutRelationships, AllWrestlerRelationships } from "./api/types/relationships";
import { useParams } from "react-router";

import dayjs from "dayjs";
import { TeamAttributes, TeamObject } from "./api/types/objects/team";

import BoutDateFilter from "./components/BoutDateFilter";
import GeneralInfoDisplay, { BasicInfo } from "./components/GeneralInfoDisplay";

import TimeframeSummary from "./components/TimeframeSummary";

export type AthleteDataProps = {
	wrestlers: WrestlersResponse<AllWrestlerRelationships, Exclude<FloObject, WrestlerObject>>,
	bouts: BoutsResponse<AllBoutRelationships, Exclude<FloObject, BoutObject>>,
	identityPersonId: string,
}

type Wrestlers = WrestlersResponse<AllWrestlerRelationships, Exclude<FloObject, WrestlerObject>>;
type Bouts = BoutsResponse<AllBoutRelationships, Exclude<FloObject, BoutObject>>;

export default function Athletes() {
	const { id } = useParams();

	const [downloading, setDownloading] = React.useState<boolean>(false);

	const [wrestlers, setWrestlers] = React.useState<Wrestlers | null>(null);
	const [bouts, setBouts] = React.useState<Bouts | null>(null);

	const [filteredWrestlers, setFilteredWrestlers] = React.useState<Wrestlers | null>(null);
	const [filteredBouts, setFilteredBouts] = React.useState<Bouts | null>(null);

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
		if (athleteId !== id && id && id != downloadingFor) {
			if (wrestlers && wrestlers.data.find(w => w.attributes.identityPersonId == id)) return;
			void downloadData(id);
		}
	}, [id]);

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

	const [basicInfo, setBasicInfo] = React.useState<BasicInfo | null>(null);

	const seasons = React.useMemo<{ name: string, bouts: Bouts, wrestlers: Wrestlers }[]>(() => {
		if (!filteredBouts || !filteredWrestlers) return [];
		const seasons: { name: string, bouts: Bouts, wrestlers: Wrestlers }[] = [];
		// Season starts after Thanksgiving

		filteredBouts.data.forEach(bout => {
			const date = dayjs(FloAPI.findIncludedObjectById<EventObject>(bout.attributes.eventId, "event", filteredBouts)?.attributes.startDateTime);
			const seasonStart = date.clone().startOf("year").month(10).date(1).isBefore(date) ? date.clone().startOf("year").month(10).date(1) : date.clone().startOf("year").month(10).date(1).subtract(1, "year");
			const seasonName = `${seasonStart.format("YYYY")}-${seasonStart.add(1, "year").format("YY")}`;
			
			const season = seasons.find(s => s.name == seasonName);
			if (season) {
				season.bouts.data.push(bout);
				season.bouts.meta.total++;
			} else {
				seasons.push({
					name: seasonName,
					bouts: {
						data: [bout],
						included: filteredBouts.included,
						meta: { total: 1 },
						links: filteredBouts.links,
					},
					wrestlers: {
						data: [],
						included: filteredWrestlers.included,
						meta: { total: 0 },
					},
				});
			}
		});

		filteredWrestlers.data.forEach(wrestler => {
			const event = FloAPI.findIncludedObjectById<EventObject>(wrestler.attributes.eventId, "event", filteredWrestlers);
			const date = dayjs(event?.attributes.startDateTime);
			const seasonStart = date.clone().startOf("year").month(10).date(1).isBefore(date) ? date.clone().startOf("year").month(10).date(1) : date.clone().startOf("year").month(10).date(1).subtract(1, "year");
			const seasonName = `${seasonStart.format("YYYY")}-${seasonStart.add(1, "year").format("YY")}`;

			const season = seasons.find(s => s.name == seasonName);
			if (season) {
				season.wrestlers.data.push(wrestler);
				season.wrestlers.meta.total++;
			} else {
				seasons.push({
					name: seasonName,
					bouts: {
						data: [],
						included: filteredBouts.included,
						meta: { total: 0 },
					},
					wrestlers: {
						data: [wrestler],
						included: filteredWrestlers.included,
						meta: { total: 1 },
					}
				});
			}
		});

		console.log({seasons});

		return seasons;
	}, [filteredBouts, filteredWrestlers]);

	const downloadData = async (identityPersonId: string) => {
		if (identityPersonId == athleteId || identityPersonId == downloadingFor) return;
		console.log(identityPersonId, athleteId, downloadingFor);

		setDownloadingFor(identityPersonId);
		setDownloading(true);

		try {
			const start = performance.now();
			nprogress.start();
			// Fetch all wrestler instances for athlete ID
			let temp_progress = 0;
			const wrestlersResponse = await FloAPI.fetchWrestlersByAthleteId<AllWrestlerRelationships, Exclude<FloObject, WrestlerObject>>(identityPersonId, {
				pageSize: 0,
				pageOffset: 0,
				onProgress: p => {
					if (p > temp_progress) {
						temp_progress = p;
						nprogress.set(p / 2);
					}
				},
			}, WrestlersIncludeAll);

			wrestlersResponse.data.sort((a, b) => {
				const aEvent = FloAPI.findIncludedObjectById<EventObject>(a.attributes.eventId, "event", wrestlersResponse);
				const bEvent = FloAPI.findIncludedObjectById<EventObject>(b.attributes.eventId, "event", wrestlersResponse);

				const aDate = aEvent?.attributes.endDateTime ?? aEvent?.attributes.startDateTime;
				const bDate = bEvent?.attributes.endDateTime ?? bEvent?.attributes.startDateTime;

				return dayjs(aDate).isBefore(dayjs(bDate)) ? 1 : dayjs(aDate).isAfter(dayjs(bDate)) ? -1 : 0;
			});

			nprogress.set(50);
			temp_progress = 50;

			setWrestlers(wrestlersResponse);

			// Fetch all bouts of athlete ID
			const boutsResponse = await FloAPI.fetchBouts<AllBoutRelationships, Exclude<FloObject, BoutObject>>(identityPersonId, {
				pageSize: 0,
				pageOffset: 0,
				onProgress: p => {
					if (p > temp_progress) {
						temp_progress = p;
						nprogress.set(50 + p / 2);
					}
				},
			}, BoutsIncludeAll);

			const teamIdentityIds = [...new Set(wrestlersResponse.data.map(w => FloAPI.findIncludedObjectById<TeamObject>(w.attributes.teamId, "team", wrestlersResponse)).map(t => t?.attributes.identityTeamId).filter(t => typeof t == "string"))];
			const teamBasics = teamIdentityIds.map(t => wrestlersResponse.included.find(i => i.type == "team" && i.attributes.identityTeamId == t)?.attributes) as TeamAttributes[];

			const basicInfo = {
				name: wrestlersResponse.data.find(w => w.attributes.firstName) ? (wrestlersResponse.data.find(w => w.attributes.firstName)?.attributes.firstName + " " + wrestlersResponse.data.find(w => w.attributes.lastName)?.attributes.lastName) : undefined,
				dateOfBirth: wrestlersResponse.data.find(w => w.attributes.dateOfBirth) ?  dayjs(wrestlersResponse.data.find(w => w.attributes.dateOfBirth)?.attributes.dateOfBirth) : undefined,
				grade: wrestlersResponse.data.find(w => w.attributes.grade)?.attributes.grade,
				teams: teamBasics.map(team => {
					const identityId = team.identityTeamId;

					return {
						attributes: team,
						matches: boutsResponse.data.filter(bout => {
							const top = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.topWrestlerId, "wrestler", boutsResponse);
							const bottom = FloAPI.findIncludedObjectById<WrestlerObject>(bout.attributes.bottomWrestlerId, "wrestler", boutsResponse);
							const current = top?.attributes.identityPersonId == identityPersonId ? top : bottom;
							if (!current) return false;
							return FloAPI.findIncludedObjectById<TeamObject>(current.attributes.teamId, "team", boutsResponse)?.attributes.identityTeamId == identityId;
						}),
					};
				}),
			} as BasicInfo;

			setBasicInfo(basicInfo);

			document.title = `${basicInfo.name} - FloStats`;

			setBouts(boutsResponse);

			setAthleteId(identityPersonId);
			setDownloading(false);

			(window as any)["bouts"] = boutsResponse;

			if (boutsResponse && boutsResponse.data.length) {
				const oldest = boutsResponse.data.map(bout => new Date(bout.attributes.endDateTime ?? bout.attributes.goDateTime ?? Date.now())).reduce((a, b) => a < b ? a : b);
				const newest = boutsResponse.data.map(bout => new Date(bout.attributes.endDateTime ?? bout.attributes.goDateTime ?? Date.now())).reduce((a, b) => a > b ? a : b);
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
		<Stack w="100%" align="center">
			{downloading ? <Overlay backgroundOpacity={0} blur={2} h={"100%"} fixed={true} /> : null}
			{basicInfo ? <GeneralInfoDisplay info={basicInfo} /> : null}
			<BoutDateFilter startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} oldestBout={oldestBout} newestBout={newestBout} />
			<Stack gap="sm" mb="md" align="center">
				<Group content="center">
					<Checkbox checked={filter.eventType.duals} label="Duals" onChange={e => {
						if (!e.target.checked) {
							setFilter({ ...filter, eventType: { ...filter.eventType, duals: false, tournaments: true } });
						} else {
							setFilter({ ...filter, eventType: { ...filter.eventType, duals: true } });
						}
					}} />
					<Checkbox checked={filter.eventType.tournaments} label="Tournaments" onChange={e => {
						if (!e.target.checked) {
							setFilter({ ...filter, eventType: { ...filter.eventType, tournaments: false, duals: true } });
						} else {
							setFilter({ ...filter, eventType: { ...filter.eventType, tournaments: true } });
						}
					}} />
				</Group>
				<Group>
					<Checkbox checked={filter.byes} label="Byes" onChange={e => setFilter({ ...filter, byes: e.target.checked })} />
					<Checkbox checked={filter.forfeits} label="Forfeits" onChange={e => setFilter({ ...filter, forfeits: e.target.checked })} />
				</Group>
			</Stack>
			{filteredBouts && filteredWrestlers && athleteId ? (
				<Stack w="100%">
					<TimeframeSummary title="Total Summary" bouts={filteredBouts} wrestlers={filteredWrestlers} identityPersonId={athleteId} />
					{seasons.filter(season => season.bouts.meta.total > 0).map(season => (
						<TimeframeSummary key={season.name} title={season.name} bouts={season.bouts} wrestlers={season.wrestlers} identityPersonId={athleteId} />
					))}
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