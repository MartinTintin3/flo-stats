import { nprogress } from "@mantine/nprogress";
import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import FloAPI from "../api/FloAPI";
import { SearchResultPerson, SearchResults } from "../api/types/responses";
import { Card, Group, Image, Pagination, Skeleton, Stack, Text, Title, Tooltip } from "@mantine/core";
import dayjs from "dayjs";

import styles from "./SearchResults.module.css";

const PAGE_SIZE = 10;

function chunk<T>(array: T[], size: number): T[][] {
	if (!array.length) {
		return [];
	}

	const head = array.slice(0, size);
	const tail = array.slice(size);

	return [head, ...chunk(tail, size)];
}

export default function SearchResultsPage() {
	const [searchParams, setSearchParams] = useSearchParams();

	const navigate = useNavigate();

	const [search, setSearch] = React.useState<string | null>(null);
	const [results, setResults] = React.useState<SearchResults | null>(null);

	const [loading, setLoading] = React.useState<boolean>(false);

	/*
	const visibleResults = React.useMemo(() => {
		if (!results || !results.data) return [];

		const chunks = chunk<SearchResultPerson>(results.data, PAGE_SIZE);

		return chunks[activePage - 1];
	}, [results, activePage]);
	*/

	React.useEffect(() => {
		if (results) searchParams.set("page", results?.meta.page.toString());
		setSearchParams(searchParams);
	}, [results]);

	React.useEffect(() => {
		const q = searchParams.get("q");
		const page = searchParams.get("page");

		if (q) {
			if (q != search) setSearch(q);

			document.title = `${q} - Flo Search`;
		}
	}, [searchParams]);

	React.useEffect(() => {
		if (!search) return;
		const page = parseInt((searchParams.get("page") ?? "1"));
		console.log(`Searching for ${search} (page ${page})`);

		searchFor(search, page).then(setResults).catch(console.error);
	}, [search]);

	const searchFor = async (name: string, page: number = 1) => {
		if (page > 1000) page = 1000;

		nprogress.start();
		setLoading(true);

		// Data fetched with OFP set to true is ordered correctly
		const orderData = await FloAPI.searchByName(name, {
			limit: PAGE_SIZE,
			page,
			onProgress: v => nprogress.set(v / 2),
			useOfp: true,
		});
		// Fetch actual data
		const data = await FloAPI.searchByName(name, {
			limit: PAGE_SIZE,
			page,
			onProgress: v => nprogress.set(v / 2 + 50),
		});

		nprogress.complete();
		setLoading(false);

		// Extract sequence of IDs
		const sortSeq = orderData.data?.map(v => v.node.id);

		// Sort data using correct sequence
		if (data.data && sortSeq) data.data.sort((a, b) => sortSeq.indexOf(a.id) - sortSeq.indexOf(b.id));


		return data;
	};

	const switchPage = (page: number) => {
		if (search) searchFor(search, page).then(data => {
			setResults(data);
		}).catch(console.error);
	}

	return (
		<div>
			<h1>Search Results</h1>
			{results ? (results.meta.total && results.data) ? (
				<Stack align="stretch">
					<Stack>
						{results.data.map((result, i) => (
							<Card key={result.id} styles={{ root: { textAlign: "left", flexBasis: "11rem", justifyContent: "center" } }}  p="lg" className={styles.result}>
								<Link to={`/athletes/${result.arena_person_identity_id}`} style={{ textDecoration: "none" }} className={styles.resultLink}>
									<Group align={"end"}><Title order={3}>{result.name}</Title><Text c="dimmed">ID: {result.arena_person_identity_id}</Text></Group>
									{result.location ?
										<Group>
											<p>{result.location.name} ({[result.location.city, result.location.state].filter(v => v).join(", ")})</p> <Text c="dimmed">{result.location.google_place_id}</Text>
										</Group>
									: null}
									<Text><Text span fw={600}>HS Graduation:</Text> {result.high_school_grad_year}</Text>
									{result.birth_date ? <Text><Text span fw={600}>Birthdate:</Text> {dayjs(result.birth_date).format("MMMM D, YYYY")}</Text> : null}
								</Link>
							</Card>
						))}
					</Stack>
					<Pagination
						total={Math.min(results.meta.max_limit, results.meta.pages)} value={results.meta.page} withEdges withControls onChange={switchPage}
						styles={{ root: { justifyItems: "center" } }}
					/>
				</Stack>
			) : (
				<p>No results found</p>
			): (
				[...Array(PAGE_SIZE)].map((_, i) => (
					<Skeleton key={i} height={140} style={{ marginBottom: "1rem" }} />
				))
			)}
		</div>
	)
}