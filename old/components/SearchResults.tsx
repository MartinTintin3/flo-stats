import { nprogress } from "@mantine/nprogress";
import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import FloAPI, { SearchResultsTyped } from "../api/FloAPI";
import { NodeResult, SearchResultPerson, SearchResultPersonUseOfp, SearchResults } from "../api/types/responses";
import { Card, Pagination, Skeleton, Stack, Text, Title } from "@mantine/core";
import dayjs from "dayjs";

import styles from "./SearchResults.module.css";

const PAGE_SIZE = 10;

export default function SearchResultsPage() {
	const [searchParams, setSearchParams] = useSearchParams();

	const [broadSearch, setBroadSearch] = React.useState<boolean>(false);

	const [search, setSearch] = React.useState<string | null>(null);

	const [narrowResults, setNarrowResults] = React.useState<SearchResultsTyped<false> | null>(null);
	const [broadResults, setBroadResults] = React.useState<SearchResultsTyped<true> | null>(null);

	const [loading, setLoading] = React.useState<boolean>(false);

	const [loadingExtra, setLoadingExtra] = React.useState<boolean>(false);
	const [extraData, setExtraData] = React.useState<Map<number, NodeResult>>(new Map());

	const navigate = useNavigate();

	React.useEffect(() => {
		console.log("Search results page mounted");
	});

	React.useEffect(() => {
		if (broadSearch && broadResults) {
			searchParams.set("page", broadResults?.meta.page.toString());
			setSearchParams(searchParams);
		} else if (narrowResults) {
			searchParams.set("page", narrowResults?.meta.page.toString());
			setSearchParams(searchParams);
		}
	}, [narrowResults, broadResults, broadSearch, searchParams, setSearchParams]);

	React.useEffect(() => {
		const q = searchParams.get("q");
		const ofp = searchParams.get("ofp");

		if (q) {
			if (q != search) setSearch(q);

			document.title = `${q} - FloStats`;
		}

		if (ofp) {
			if (broadSearch != (ofp === "true")) setBroadSearch(ofp === "true");
		}

		console.log(extraData);
	}, [broadSearch, extraData, search, searchParams]);

	React.useEffect(() => {
		if (!search) return;
		const page = parseInt((searchParams.get("page") ?? "1"));
		console.log(`Searching for ${search} (page ${page})`);

		setBroadResults(null);
		setNarrowResults(null);

		searchFor(search, page, searchParams.get("ofp") === "true").then(results => {
			if (searchParams.get("ofp") === "true") setBroadResults(results as SearchResultsTyped<true>);
			else setNarrowResults(results as SearchResultsTyped<false>);
		}).catch(console.error);
	}, [search, broadSearch, searchParams]);

	const searchFor = async <T extends boolean>(name: string, page: number = 1, useOfp: T) => {
		if (page > 1000) page = 1000;

		nprogress.start();
		setLoading(true);

		if (useOfp) setLoadingExtra(true);

		// Data fetched with OFP set to true is ordered correctly
		const orderData = await FloAPI.searchByName(name, {
			limit: PAGE_SIZE,
			page,
			onProgress: v => nprogress.set(v / 2),
			useOfp: true,
		});

		let data: SearchResultsTyped<T>;

		if (!useOfp) {
			data = await FloAPI.searchByName<T>(name, {
				limit: PAGE_SIZE,
				page,
				onProgress: v => nprogress.set(v / 2 + 50),
				useOfp,
			});
		} else {
			data = orderData as SearchResultsTyped<T>;
			setLoadingExtra(true);
			const extraData = new Map();
			new Promise<void>(async resolve => {
				console.log("Loading extra data...", loadingExtra, data.data);
				for (const result of data.data ?? []) {
					const extra = await FloAPI.fetchFromNode(result.node.id);
					extraData.set(result.node.id, extra);
				}
				resolve();
			}).then(() => {
				console.log(`Loaded ${extraData.size} extra data`);
				setExtraData(extraData);
				setLoadingExtra(false);
			});
		}

		nprogress.complete();
		setLoading(false);

		// Extract sequence of IDs
		const sortSeq = orderData.data?.map(v => v.node.id);

		// Sort data using correct sequence
		if (!useOfp && data.data && sortSeq) (data as SearchResults<SearchResultPerson>).data?.sort((a, b) => sortSeq.indexOf(a.id) - sortSeq.indexOf(b.id));

		return data;
	};

	const switchPage = (page: number) => {
		if (search) searchFor(search, page, broadSearch).then(data => {
			if (broadSearch) setBroadResults(data as SearchResultsTyped<true>);
			else setNarrowResults(data as SearchResultsTyped<false>);
		}).catch(console.error);
	};

	const broadResultsClick = (result: SearchResultPersonUseOfp) => {
		void FloAPI.fetchFromNode(result.node.id).then(data => {
			void navigate(`/athletes/${data.data.arena_person_identity_id}`);
		});
	};

	return (
		<Stack>
			<Title order={1}>{broadSearch ? "Broad" : "Narrow"} {loading ? "Search...": "Results"}</Title>
			{loading ? (
				[...Array<string>(PAGE_SIZE)].map((_, i) => (
					<Skeleton key={i} style={{ marginBottom: "1rem" }} />
				))
			) : ((narrowResults && narrowResults.data && !broadSearch) ? (
				<Stack align="stretch" gap="xl" mb="xl">
					<Stack>
						{narrowResults.data.map((result) => (
							<Card key={result.id} styles={{ root: { textAlign: "left", flexBasis: "11rem", justifyContent: "center" } }} p="lg" className={styles.result} mx="xs">
								<Link to={`/athletes/${result.arena_person_identity_id}`} style={{ textDecoration: "none" }} className={styles.resultLink}>
									<Title order={3}>{result.name}</Title><Text size="xs" c="dimmed">ID: {result.arena_person_identity_id}</Text>
									{result.location ?
										<Text><Text span fw={600}>Location:</Text> {result.location.name} ({[result.location.city, result.location.state].filter(v => v).join(", ")})</Text>
										: <Text c="dimmed">No location data</Text>}
									<Text><Text span fw={600}>HS Graduation:</Text> {result.high_school_grad_year}</Text>
									{result.birth_date ? <Text><Text span fw={600}>Birthday:</Text> {dayjs(result.birth_date).format("MMMM D, YYYY")}</Text> : <Text c="dimmed">Birth date unavailable</Text>}
								</Link>
							</Card>
						))}
					</Stack>
					<Pagination
						total={Math.min(narrowResults.meta.max_limit, narrowResults.meta.pages)} value={narrowResults.meta.page} withEdges withControls onChange={switchPage}
						styles={{ root: { justifyItems: "center", justifyContent: "center" } }}
						className={styles.resultsPagination}
					/>
				</Stack>
			) : (broadResults && broadResults.data && broadSearch) ? (
				<Stack align="stretch" gap="xl" mb="xl">
					<Stack>
						{extraData.size ? Array.from(extraData.values()).map((extra) => (
							<Card key={extra.data.original_entity.id} styles={{ root: { textAlign: "left", flexBasis: "11rem", justifyContent: "center" } }} p="lg" className={styles.result} mx="xs">
								<Link to={`/athletes/${extra.data.original_entity.arena_person_identity_id}`} style={{ textDecoration: "none" }} className={styles.resultLink}>
									<Title order={3}>{extra.data.original_entity.name}</Title><Text size="xs" c="dimmed">ID: {extra.data.original_entity.arena_person_identity_id}</Text>
									{extra.data.original_entity.location ?
										<Text><Text span fw={600}>Location:</Text> {extra.data.original_entity.location.name} ({[extra.data.original_entity.location.city, extra.data.original_entity.location.state].filter(v => v).join(", ")})</Text>
										: <Text c="dimmed">No location data</Text>}
									<Text><Text span fw={600}>HS Graduation:</Text> {extra.data.original_entity.high_school_grad_year}</Text>
									{extra.data.original_entity.birth_date ? <Text><Text span fw={600}>Birthday:</Text> {dayjs(extra.data.original_entity.birth_date).format("MMMM D, YYYY")}</Text> : <Text c="dimmed">Birth date unavailable</Text>}
								</Link>
							</Card>
						)) : broadResults.data.map((result) => (
							<Card key={result.id} styles={{ root: { textAlign: "left", flexBasis: "11rem", justifyContent: "center" } }} p="lg" className={styles.result} mx="xs" onClick={() => !extraData.get(result.node.id) ? broadResultsClick(result) : null}>
								<Title order={3}>{result.title}</Title><Text size="xs" c="dimmed">ID: {result.node.id} ({result.id})</Text>
								<Text>Loading...</Text>
							</Card>
						))}
					</Stack>
					<Pagination
						total={Math.min(broadResults.meta.max_limit, broadResults.meta.pages)} value={broadResults.meta.page} withEdges withControls onChange={switchPage}
						styles={{ root: { justifyItems: "center", justifyContent: "center" } }}
						className={styles.resultsPagination}
					/>
				</Stack>
			) : (
				<p>No results found</p>
			))}
		</Stack>
	);
}