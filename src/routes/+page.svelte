<script>
	import { page } from "$app/stores";
	import { onMount } from "svelte";

	import { afterNavigate, goto } from "$app/navigation";
	import { ratio, humanFileSize, DownloadingState, getWithProgress, getIncludedObject, SearchingState } from "../defs";
	
	import Stats from "../components/Stats.svelte";
	import Modal from "../components/Modal.svelte";
	import Collapsible from "../components/Collapsible.svelte";
	import { browser } from "$app/environment";

	let downloading = false;

	/** @type {string | null} */
	let quick_name = null;

	/** @type {import("../defs").DownloadingState | null} */
	let downloading_state = DownloadingState.BOUTS;

	let downloading_progress = 0; // between 0 and 1;

	let input = "";

	$: currentSearchParams = browser ? Object.fromEntries($page.url.searchParams) : null

  	$: console.log('currentSearchParams', currentSearchParams);

	/** @type {{
	 * name: string;
	 * location: {
	 * 	name: string | null;
	 *	country: string | null;
	 *	state: string | null;
	 *  city: string | null;
	 * } | null;
	 * hs_graduation_year: number;
	 * id: string; // Arena Person Identity ID
	 * }[]} */
	let search_results = [];
	let search_total = 0;

	let show_search_modal = false;

	let searching_state = SearchingState.NONE;

	/**
	 * @param {Date} date
	 */
	const get_season = date => {
		const thanksgiving = new Date(date.getFullYear(), 10, 1);
		
		if (thanksgiving.getDay() > 4) {
			thanksgiving.setDate(thanksgiving.getDate() + (4 - thanksgiving.getDay()) + 28);
		} else {
			thanksgiving.setDate(thanksgiving.getDate() + (4 - thanksgiving.getDay()) + 21);
		}

		if (date < thanksgiving) {
			return `${date.getFullYear() - 1}-${date.getFullYear()}`;
		} else {
			return `${date.getFullYear()}-${date.getFullYear() + 1}`;
		}
	};

/*
"bracketSpot": null,
        "city": "Lexington",
        "comments": null,
        "createdByUserId": "10015558",
        "createdDateTimeUtc": "2024-01-09T10:45:31.000Z",
        "custom1": null,
        "custom2": null,
        "dateOfBirth": null,
        "districtPlace": null,
        "divisionId": "e1c8a42f-cf55-43c3-88e9-320b432eb7d5",
        "draw": null,
        "eventId": "a60ccb57-42bc-4ac1-9821-4c89088ad3e9",
        "exactWeight": 138.5,
        "exactWeight2": null,
        "exactWeight3": null,
        "exempt": null,
        "firstName": "Martin",
        "fullName": "Maroyan, Martin",
        "gender": null,
        "grade": {
            "attributes": {
                "name": "HS Freshman",
                "numericValue": 9,
                "sequence": 11
            },
            "id": "70173183-d7ac-4ca6-bd16-21a84d63b4cb",
            "type": "grade"
        },
        "gradeId": "70173183-d7ac-4ca6-bd16-21a84d63b4cb",
        "identityPersonId": "064ad7f4-8d16-4dd2-94b1-1dd1c45c3832",
        "isSkinChecked": true,
        "isTeamScorer": true,
        "isWeighInOk": true,
        "lastName": "Maroyan",
        "location": {
            "address": null,
            "city": "Lexington",
            "country": "US",
            "googlePlaceId": "ChIJy1hS39qd44kRzRM2FsiFNoU",
            "id": "e9055699-96a6-4dee-8888-b290dd20df8f",
            "latitude": 42.4473497,
            "longitude": -71.2271531,
            "name": "Lexington",
            "state": "MA",
            "zipCode": null
        },
        "modifiedByUserId": "18988755",
        "modifiedDateTimeUtc": "2024-01-13T13:07:44.000Z",
        "nickname": null,
        "nwcaId": null,
        "onlineRegistrationStatus": "complete",
        "opcNumber": null,
        "otbId": 148,
        "paid": true,
        "previousPlace": null,
        "record": "16-6",
        "regionPlace": null,
        "sectionPlace": null,
        "seed": null,
        "seedingCriteria1": null,
        "seedingCriteria2": null,
        "seedingCriteria3": null,
        "seedingCriteria4": null,
        "seedingCriteria5": null,
        "skillLevelId": null,
        "source": "online-registration",
        "state": "MA",
        "teamId": "caef87e3-8d30-497d-8761-1f0a9ed9df91",
        "tier": null,
        "usaWrestlingCardNum": null,
        "weightClassId": "2ea1ed67-07ba-4550-bc0e-70c801833d44",
        "withdrawn": false,
        "zipCode": null
*/

	/** @type {import("../defs").Data} */
	const data = {
		response_size: 0,
		wrestler: null,
	};

	/**
	 * @param {string} id
	 * @param {boolean} guaranteed 
	*/
	const load_data = async (id, guaranteed = false, latest_location = undefined) => {
		if (id == "") return alert("No ID/URL provided");

		const headers = new Headers({
			"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
		});

		// example id: 064ad7f4-8d16-4dd2-94b1-1dd1c45c3832

		if (id.includes("flowrestling.org")) {
			const regex = /flowrestling.org\/athletes\/((?:[0-9a-z]+-?)+)/g;

			const match = regex.exec(id);
			
			if (match && match[1]) {
				id = match[1];
			} else {
				alert("Invalid link");
				return;
			}

		}

		window["get_season"] = get_season;

		downloading_state = DownloadingState.CHECKING;
		downloading = true;

		if (!await (async () => {
			try {
				const res = await fetch(`https://floarena-api.flowrestling.org/bouts/?identityPersonId=${id}&page[size]=1&page[offset]=0&include=topWrestler,bottomWrestler`, { headers });
				const data = await res.json();

				const wrestler = data.included?.find(x => x.type == "wrestler" && x.attributes.identityPersonId == id);

				if (wrestler) {
					quick_name = `${wrestler.attributes.firstName} ${wrestler.attributes.lastName}`;
				} else if (!guaranteed) {
					return false;
				}

				history.pushState({}, "", `?id=${id}`);
				document.title = `${quick_name} | Flo Stats`;
		
				return data.meta.total > 0;
			} catch (e) {
				return false;
			}
		})()) {
			downloading = false;

			alert(`0 matches found for ${quick_name ?? ""} (ID ${id})`);
			return;
		}

		data.wrestler = null;

		await (async () => {
			console.log("Fetching bouts...");
			downloading = true;
			downloading_progress = 0;
			downloading_state = DownloadingState.BOUTS;
			let req = await getWithProgress(`https://floarena-api.flowrestling.org/bouts/?identityPersonId=${id}&page[size]=0&hasResult=true&page[offset]=0&include=bottomWrestler.team,topWrestler.team,weightClass,topWrestler.division,bottomWrestler.division,event,roundName`, headers, (loaded, total) => {
				data.response_size = loaded;
				downloading_progress = loaded / total / 2;
			});
			downloading_progress = 0.5;
			//let req = await fetch(`https://floarena-api.flowrestling.org/bouts/?identityPersonId=${id}&page[size]=0&hasResult=true&page[offset]=0&include=bottomWrestler.team,topWrestler.team,weightClass,topWrestler.division,bottomWrestler.division`, { headers });
			//data.response_size = parseInt(req.headers.get("content-length") ?? "0");
			const bouts_data = req;

			console.log("Fetching placements...");
			downloading_state = DownloadingState.PLACEMENTS;
			downloading_progress = 0.5;
			const starting_size = data.response_size;
			req = await getWithProgress(`https://floarena-api.flowrestling.org/wrestlers/?identityPersonId=${id}&page[size]=0&page[offset]=0&include=bracketPlacements.weightClass,division,event,weightClass,team`, headers, (loaded, total) => {
				data.response_size = starting_size + loaded;
				downloading_progress = loaded / total / 2 + 0.5;
			});
			downloading_progress = 1;
			const placements_data = req;

			downloading = false;

			console.log("Processing...");

			bouts_data.included = bouts_data.included ?? [];

			bouts_data.included.sort((a, b) => {
				Date.parse(a.attributes.modifiedDateTimeUtc) - Date.parse(b.attributes.modifiedDateTimeUtc);
			});

			const wrestler = bouts_data.included.find(x => x.type == "wrestler" && x.attributes.identityPersonId == id);
			const division = bouts_data.included.find(x => x.type == "division" && x.id == wrestler.attributes.divisionId);

			/*const thanksgiving = new Date(new Date().getFullYear(), 10, 1);
			thanksgiving.setDate(thanksgiving.getDate() + (4 - thanksgiving.getDay()) + 21);
			
			const season_start = new Date(thanksgiving.getFullYear(), thanksgiving.getMonth(), thanksgiving.getDate() + 4);*/

			const filteredBouts = bouts_data.data.filter(x => x.attributes.winType != "BYE" && x.attributes.winnerWrestlerId);

			/** @type {import("../defs").Stats} */
			const total_stats = {
				total: 0,
				wins: 0,
				losses: 0,
				pins: 0,
				techs: 0,
				ratio: [0, 0],
			};

			filteredBouts.forEach(bout => {
				const winner = getIncludedObject(bouts_data, "wrestler", bout.attributes.winnerWrestlerId);
				if (winner && !(bout.attributes.dualId && bout.attributes.winType == "FOR")) {
					total_stats.total++;
					if (winner.attributes.identityPersonId == wrestler.attributes.identityPersonId) {
						total_stats.wins++;

						if (bout.attributes.winType == "F") {
							total_stats.pins++;
						} else if (bout.attributes.winType == "TF") {
							total_stats.techs++;
						}
					} else {
						total_stats.losses++;
					}
				}
			});

			total_stats.ratio = ratio(total_stats.wins, total_stats.losses);

			/** @type {Array<{
			 * 	season: string,
			 * 	stats: import("../defs").Stats,
			 * 	grade: import("../defs").Grade | null,
			 * 	placements: Array<import("../defs").PlacementInfo>,
			 *  matches: Array<import("../defs").Match>
			 * }>
			 * } */
			const seasons = [];

			latest_location = wrestler?.attributes.location ?? latest_location;

			filteredBouts.forEach(bout => {
				const top_wrestler = getIncludedObject(bouts_data, "wrestler", bout.attributes.topWrestlerId);
				const bottom_wrestler = getIncludedObject(bouts_data, "wrestler", bout.attributes.bottomWrestlerId);

				const selected_wrestler = top_wrestler ? top_wrestler.attributes.identityPersonId == wrestler.attributes.identityPersonId ? top_wrestler : bottom_wrestler : bottom_wrestler;

				if (!latest_location || latest_location.city == null || latest_location.state == null || latest_location.country == null) {
					latest_location = {
						city: selected_wrestler.attributes.location.city,
						state: selected_wrestler.attributes.location.state,
						country: selected_wrestler.attributes.location.country,
					};
				}

				const winner = getIncludedObject(bouts_data, "wrestler", bout.attributes.winnerWrestlerId);
				if (winner && !(bout.attributes.dualId && (bout.attributes.winType == "FOR" || bout.attributes.winType == "VFO"))) {
					const season = get_season(new Date(bout.attributes.modifiedDateTimeUtc || bout.attributes.createdDateTimeUtc));

					if (!seasons.find(x => x.season == season)) {
						seasons.push({
							season,
							stats: {
								total: 0,
								wins: 0,
								losses: 0,
								pins: 0,
								techs: 0,
								ratio: [0, 0],
							},
							grade: null,
							placements: [],
							matches: [],
						});
					}

					// @ts-ignore
					const season_stats = seasons.find(x => x.season == season).stats;

					season_stats.total++;

					const event = getIncludedObject(bouts_data, "event", bout.attributes.eventId);
					const round = getIncludedObject(bouts_data, "roundName", bout.attributes.roundNameId);
					const division = getIncludedObject(bouts_data, "division", winner.relationships.division.data.id);
					const opponent = top_wrestler ? top_wrestler.attributes.identityPersonId == wrestler.attributes.identityPersonId ? bottom_wrestler : top_wrestler : bottom_wrestler;
					const opponent_team = getIncludedObject(bouts_data, "team", opponent?.attributes.teamId);
					const weight_class = getIncludedObject(bouts_data, "weightClass", bout.attributes.weightClassId);

					let date = new Date(event.attributes.startDateTime);
					// make sure there is a leading 0
					let month = (date.getMonth() + 1).toString().padStart(2, "0");
					let day = date.getDate().toString().padStart(2, "0");
					let year = date.getFullYear();

					seasons.find(x => x.season == season).matches.push({
						id: bout.id,
						event: {
							name: event.attributes.name,
							id: event.id,
						},
						date: `${month}/${day}/${year}`,
						division: division?.attributes.name,
						opponent: opponent ? {
							id: opponent.attributes.identityPersonId,
							name: `${opponent.attributes.firstName} ${opponent.attributes.lastName}`,
							team: {
								name: opponent_team?.attributes.name,
								state: opponent_team?.attributes.state,
							},
						} : null,
						weight_class: weight_class ? `${weight_class.attributes.name} ${division?.attributes.measurementUnit ?? "lbs"}` : "N/A",
						result: `${bout.attributes.winType} ${bout.attributes.result}`,
						win: winner.attributes.identityPersonId == wrestler.attributes.identityPersonId,
						round: round?.attributes.displayName,
					});
					

					if (winner.attributes.identityPersonId == wrestler.attributes.identityPersonId) {
						season_stats.wins++;

						if (bout.attributes.winType == "F") {
							season_stats.pins++;
						} else if (bout.attributes.winType == "TF") {
							season_stats.techs++;
						}
					} else {
						season_stats.losses++;
					}

					if (selected_wrestler.attributes.grade && selected_wrestler.attributes.grade.attributes.name != "NA") {
						console.log(selected_wrestler.attributes.grade.attributes.name, selected_wrestler.attributes.grade.attributes.numericValue);
						seasons.find(x => x.season == season).grade = {
							name: selected_wrestler.attributes.grade.attributes.name,
							number: selected_wrestler.attributes.grade.attributes.numericValue,
						};
					}
				}
			});

			seasons.forEach(season => {
				season.stats.ratio = ratio(season.stats.wins, season.stats.losses);
			});

			placements_data.data.forEach(w => {
				const event = getIncludedObject(placements_data, "event", w.attributes.eventId);
				const placement_info = w.relationships.bracketPlacements.data[0] ? getIncludedObject(placements_data, "bracketPlacement", w.relationships.bracketPlacements.data[0].id) : null;
				const weight_class = getIncludedObject(placements_data, "weightClass", w.attributes.weightClassId);
				const division = getIncludedObject(placements_data, "division", w.attributes.divisionId);

				const season = get_season(new Date(event.attributes.startDateTime));

				if (event.attributes.isDual) return;

				seasons.find(x => x.season == season)?.placements.push({
					event: {
						name: event.attributes.name,
						id: event.id,
						date: new Date(event.attributes.startDateTime).toLocaleDateString(),
					},
					placement: placement_info ? placement_info.attributes.placementDisplay : Date.now() - Date.parse(event.attributes.startDateTime) < 0 ? "N/A (TBD)" : "DNP",
					division: division?.attributes.name,
					weight_class: weight_class ? `${weight_class.attributes.name} ${division?.attributes.measurementUnit ?? "lbs"}`: "",
				});
			});

			seasons.forEach(season => {
				season.placements.sort((a, b) =>  (new Date(b.event.date)).getTime() - (new Date(a.event.date)).getTime());
				season.matches.sort((a, b) =>  (new Date(b.date)).getTime() - (new Date(a.date)).getTime());
			});

			data.wrestler = {
				id: wrestler.attributes.identityPersonId,
				firstName: wrestler.attributes.firstName,
				lastName: wrestler.attributes.lastName,
				grade: seasons[0].grade,
				location: latest_location,
				total_stats,
				seasons,
			}

			input = "";

			window["current_data"] = data;
		})();
	};

	/** @param {string} name */
	const search = async (name) => {
		goto(`?q=${name}`);

		if (!name.match(/^(?:(?!:\/\/|flowrestling).)*$/gm)) return alert("Invalid input");

		searching_state = SearchingState.SEARCHING;
		show_search_modal = false;

		await (new Promise(r => setTimeout(r, 500)));

		show_search_modal = true;

		const res = await (await fetch(`https://api.flowrestling.org/api/experiences/web/legacy-core/search?site_id=2&version=1.24.0&limit=200&view=global-search-web&fields=data%3C1%3E&q=${encodeURIComponent(name)}&page=1&type=person`)).json();

		searching_state = SearchingState.PROCESSING;

		search_total = res.meta.total;

		if (!res.data) {
			search_results = [];
		} else {
			search_results = res.data.map(o => { return {
				name: o.name,
				location: o.location,
				hs_graduation_year: o.high_school_grad_year,
				id: o.arena_person_identity_id,
			}});
		}

		searching_state = SearchingState.NONE;
	};

	afterNavigate(() => {
		const q = $page.url.searchParams.get("q");
		const id = $page.url.searchParams.get("id");

		if (id) { load_data(id); input = id; return; }
		if (q && !searching_state) { search(q); input = q; return; }
	});

	onMount(() => {
		const q = currentSearchParams?.q;
		const id = currentSearchParams?.id;

		if (id) { load_data(id); input = id; return; }
		if (q && !searching_state) { search(q); input = q; return; }
	});

	const on_search_click = () => {
		if (!input.includes("flowrestling") && !input.includes("-") && !input.match(/[0-9]/)) {
			search(input);
		} else {
			quick_name = null;
			load_data(input);
		}
	};

	const handle_popstate = () => {
		if ($page.url.searchParams.get("id") && $page.url.searchParams.get("id") != data.wrestler?.id) {
			const id = $page.url.searchParams.get("id");
			if (id) { load_data(id); input = id };
		}
	}

	let showing_help = false;
</script>

<svelte:head>
	<title>Flo Stats</title> 
</svelte:head>

<svelte:window on:keydown={({ key, repeat }) => { if (!repeat && key == "Enter") { on_search_click(); } }} />

<Modal bind:showModal = {showing_help}>
	<div slot="header">
		<h2>How to use this tool</h2>
	</div>

	<div class="help-info">
		<span>Every athlete on FloWrestling has a unique ID that can be used to fetch their record (And subsequently calculate their stats). This ID can be found in the URL of their "results" page. For example, the ID of <a target="_blank" href="https://www.flowrestling.org/athletes/064ad7f4-8d16-4dd2-94b1-1dd1c45c3832">this athlete</a> is <span class="monospace">064ad7f4-8d16-4dd2-94b1-1dd1c45c3832</span>. <span class="bold red">If you don't have their ID, you can search for the athlete by <span class="underline">name</span>. </span></span>

		<h3>Either input a <span class="bold underline">name</span> or an <span class="bold underline">athlete ID</span></h3>

		<img src="/example.png" alt="Example of an athlete ID" style="width: 80%;" />

		<span class="help-subtitle">Athlete IDs can be found in <a target="_blank" href="https://arena.flowrestling.org">FloArena</a> tournaments</span>
	</div>
</Modal>

<Modal bind:showModal = {show_search_modal}>
	<h2 slot="header">Results for "{input}"</h2>

	<div class="search-results">
		{#if searching_state}
			<p>{searching_state == SearchingState.SEARCHING ? "Searching..." : `Processing ${search_total} result${search_total == 1 ? "" : "s"}...`}</p>
		{:else}
			{#if search_results.length}
				<h3>Choose an athlete ({search_total} total):</h3>
				<div class="search-result-options">
					{#each search_results as option}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<a class="search-result" on:click={() => {
							input = option.id;
							show_search_modal = false;
							quick_name = option.name;
							//load_data(option.id, true);
						}} href="?id={option.id}">
							<h3 class="option-name">{option.name}</h3>
							{#if option.location}
								<span class="option-location"><span class="bold">Location:</span> {option.location.name} ({option.location.city}, {option.location.state}, {option.location.country})</span>
							{:else}
								<span class="option-location"><span class="bold">Location:</span> Unknown</span>
							{/if}
							<span class="option-hs-grad-year"><span class="bold">HS Graduation Year:</span> {option.hs_graduation_year}</span>
						</a>
					{/each}
				</div>
			{:else}
				<p>No results</p>
			{/if}
		{/if}
	</div>
</Modal>

<div class="container">
	<h1>FloWrestling Statistics Calculator</h1>
	<div class="id-input">
		<div>
			<input type="text" placeholder="Athlete ID or Name" bind:value={input} name="athlete-id">
			<button type="button" id="search-btn" on:click={e => { e.preventDefault(); on_search_click(); }}>Search</button>
		</div>
		<div>
			<button type="button" on:click={() => {
				navigator.clipboard.readText().then(text => {
					input = text;
				});
			}}>Paste from Clipboard</button>
			<button type="button" on:click={() => { showing_help = true }}>Help</button>
		</div>
	</div>
	
	{#if downloading}
		<div class="download-info">
			{#if downloading_state == DownloadingState.CHECKING}
				{#if !quick_name}
					<p>Checking ID validity...</p>
				{:else}
					<p>Checking ID validity for <span style="font-weight: bold">{quick_name}</span>...</p>
				{/if}
			{:else}
				{#if downloading_state == DownloadingState.BOUTS}
					<p>Downloading bouts for <span style="font-weight: bold">{quick_name}</span>... {Math.round(downloading_progress * 100)}%</p>
				{:else}
					<p>Downloading placements for <span style="font-weight: bold">{quick_name}</span>... {Math.round(downloading_progress * 100)}%</p>
				{/if}
			{/if}
		</div>
	{:else if data.wrestler == null}
		<p>No data</p>
	{/if}

	<div class="data">
		{#if data.wrestler != null}
			<div class="basic-info">
				<span class="main-name">{data.wrestler.firstName} {data.wrestler.lastName}</span>
				<div class="main-info main-id-info">
					<span><span class="main-info-label">ID:</span> {data.wrestler.id}</span>
					<button type="button" on:click={() => {
						navigator.clipboard.writeText(data.wrestler.id);
						alert(`Copied ID of ${data.wrestler.firstName} ${data.wrestler.lastName} to clipboard`);
					}}>Copy</button>
				</div>
				{#if data.wrestler.grade}
				<span class="main-info"><span class="main-info-label">Grade:</span> ({data.wrestler.grade.number.toString()}) {data.wrestler.grade.name}</span>
				{/if}
				<span class="main-info"><span class="main-info-label">Location:</span> {data.wrestler.location.city}, {data.wrestler.location.state}, {data.wrestler.location.country}</span>

				<div class="all-stats-container">
					<div class="total-stats">
						<span class="stats-group-label">Total</span>
						<Stats stats={data.wrestler.total_stats}/>
					</div>
					<div class="season-stats">
						<span class="stats-group-label">Seasons</span>
						<div class="season-list">
							{#each data.wrestler.seasons as season}
								<div class="season">
									<h3 class="stats-label">{season.season}</h3>
									{#if season.grade}
										<span class="stats-data-field"><span class="stats-data-field-label">Grade:</span> ({season.grade.number}) {season.grade.name}</span>
									{/if}
									<Stats stats={season.stats}/>
									<div class="expandable-lists">
										{#if season.placements.length}
											<Collapsible unexpanded_title="Placements (Expand)" expanded_title="Placements (Collapse)">
												<div class="placements">
													{#each season.placements as placement}
														<div class="placement">
															<span class="placement-event"><a target="_blank" href="https://arena.flowrestling.org/event/{placement.event.id}">{placement.event.name}</a></span>
															<span>{placement.event.date}</span>
															<div class="placement-category">
																<span>{placement.division}</span>
																<span>{placement.weight_class}</span>
															</div>
															<span class="placement-display placement-{placement.placement.replace(" ", "").replace("(", "").replace(")", "").replace("/", "")}">{placement.placement}</span>
														</div>
													{/each}
												</div>
											</Collapsible>
											<Collapsible unexpanded_title="Matches (Expand)" expanded_title="Matches (Collapse)">
												<table class="matches">
													<thead>
														<tr>
															<th>Date</th>
															<th>W/L</th>
															<th>Result</th>
															<th>Opponent</th>
															<th>Opp. Team</th>
															<th>Event</th>
															<th>Round</th>
															<th>Weight</th>
														</tr>
													</thead>
													<tbody>
														{#each season.matches as match}
															<tr>
																<!-- without the year -->
																<td>{match.date}</td>
																<td><span class="match-win {match.win ? "green" : "red"}">{match.win ? "W" : "L"}</span></td>
																<td>{match.result}</td>
																{#if match.opponent}
																	<td class="opponent-name">
																		{#if match.opponent.id}
																			<a target="_blank" href="?id={match.opponent.id}">{match.opponent.name}</a>
																		{:else}
																			{match.opponent.name}
																		{/if}
																	</td>
																{:else}
																	<td>Unknown Opponent</td>
																{/if}
																{#if match.opponent}
																	<td>{match.opponent.team.name} ({match.opponent.team.state})</td>
																{:else}
																	<td></td>
																{/if}
																<td><a target="_blank" href="https://arena.flowrestling.org/event/{match.event.id}">{match.event.name.substring(0, 25) + (match.event.name.length > 25 ? "..." : "")}</a></td>
																<td>{match.round}</td>
																<td>{match.weight_class}</td>
															</tr>
														{/each}
													</tbody>
												</table>
												<!--<div class="matches">
													{#each season.matches as match}
														<div class="match">
															<div class="match-result">
																<span class="match-win {match.win ? "green" : "red"}">{match.win ? "W" : "L"}</span>
																<span class="match-score">{match.result}</span>
															</div>
															<span class="match-event"><a target="_blank" href="https://arena.flowrestling.org/event/{match.event.id}">{match.event.name}</a></span>
															<span>{match.event.date}</span>
															<div class="match-category">
																<span>{match.division}</span>
																<span>{match.weight_class}</span>
															</div>
															<span class="match-opponent">{match.opponent.name} ({match.opponent.team.name}, {match.opponent.team.state})</span>
														</div>
													{/each}
												</div>-->
											</Collapsible>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
			{#if data.response_size}
				<p class="response-size">Data size: {humanFileSize(data.response_size, true, 2)}</p>
			{/if}
		{/if}
	</div>
</div>

<style> 
	* {
		text-align: center;
		margin: auto;
		font-family: Arial, Helvetica, sans-serif;
	}

	:global(.red) {
		color: red;
	}

	:global(.green) {
		color: green;
	}

	:global(.placement-1st) {
		color: green;
	}

	/**:global(.placement-2nd) {
		color: silver;
	}

	:global(.placement-3rd) {
		color: #cd7f32;
	}

	:global(.placement-4th) {
		color: #cd7f32;
	}

	:global(.placement-5th) {
		color: #cd7f32;
	}

	:global(.placement-6th) {
		color: #cd7f32;
	}*/

	:global(.placement-DNP) {
		color: red;
	}

	:global(.bold) {
		font-weight: bold;
	}

	:global(.underline) {
		text-decoration: underline;
	}

	:global(.monospace) {
		font-family: monospace;
	}

	.container {
		padding: 0.7em;
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.id-input {
		padding: 10px;
		display: flex;
		gap: 0.3em;
		flex-direction: column;
	}

	input {
		padding: 5px;
		border-radius: 5px;
		border: 1px solid #ccc;
	}

	button {
		padding: 5px;
		border-radius: 5px;
		border: 1px solid #ccc;
		background-color: #eee;
	}

	button:hover {
		background-color: #ddd;
	}

	button:active {
		background-color: #ccc;
	}

	.basic-info, .all-stats-container {
		margin: 15px 0;
		display: flex;
		flex-direction: column;
	}

	.main-name {
		font-size: 30px;
		font-weight: bold;
	}

	.main-id-info {
		display: flex;
		flex-direction: row;
		gap: 0.5em;
	}

	.main-info, .main-info-label {
		font-size: 20px;
	}

	.main-info-label {
		font-weight: bold;
	}

	.total-stats, .season-stats {
		margin: 10px 0;
	}

	:global(.stats-data-field-label) {
		font-weight: bold;
	}

	.stats-group-label {
		font-weight: bold;
		font-size: 25px;
	}

	.season-list {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		align-content: center;
		gap: 0px;
		align-items: stretch;

		/* display: inline-block; */

		padding: 10px;
	}

	.season-list > div {
		padding: 1em;
	}

	.season-stats {
		display: flex;
		flex-direction: column;
	}

	.season {
		border: 1px solid #ccc;
		flex: 1;
		margin: initial;
	}
	
	.help-info {
		display: flex;
		flex-direction: column;
		gap: 1em;
		max-width: 800px;
	}

	.help-title {
		font-weight: bold;
	}

	.help-info > div > img {
		width: 300px;
		border: 1px solid black;
	}

	.help-info > div {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.help-subtitle {
		padding-top: 1em;
	}

	a:visited {
		color: blue;
	}

	.placements {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 1em;
	}

	.placement {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		margin: 0;
	}

	.placement-event a {
		font-weight: bold;
	}

	.placement-category {
		color: #6f6f73;
	}

	.placement > * {
		margin: 0;
	}

	.response-size {
		color: #777;
	}

	.placement-display {
		font-weight: bold;
	}

	.matches {
		border-collapse: collapse;
		border: 1px solid #ccc;
		width: 100%;
	}

	.matches th, .matches td {
		padding: 0.3em 0.5em;
	}

	.matches th {
		padding-top: 0.5em;
	}

	.matches tr:nth-child(even) {
		background-color: #f2f2f2;
	}

	.matches * {
		/** align all columns to left */
		text-align: left;
	}

	.opponent-name *, .opponent-name *:visited {
		font-weight: bold;
		color: black;
		transition: color 0.1s;
	}

	.expandable-lists {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.opponent-name a:hover {
		color: red;
		transition: color 0.1s;
	}

	.match-win {
		font-weight: bold;
	}

	.search-results {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.search-result-options {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 1em;
	}

	.search-result-options > * {
		flex: 1 0 30%; /* 33% width, no grow, no shrink */
	}

	 @media (max-width: 800px) {
		.search-result-options > * {
			flex: 1 1 100%;
		}
		
		.search-result-options {
			gap: 0.5em;
		}
	}

	.search-result {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		border: 1px solid #ccc;
		border-radius: 5px;
		padding: 1em;
		color: black;
		text-decoration: none;
	}

	.search-result * {
		color: black;
		text-decoration: none;
	}

	.search-result:hover {
		background-color: #f2f2f2;
	}

	.option-name {
		font-weight: bold;
	}
</style>