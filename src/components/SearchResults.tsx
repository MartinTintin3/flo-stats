import { nprogress } from "@mantine/nprogress";
import React from "react";
import { Link, useHref, useNavigate, useSearchParams } from "react-router";
import FloAPI from "../api/FloAPI";
import { SearchResultPerson, SearchResults } from "../api/types/responses";
import { Card, Group, Pagination, Stack, Text, Title, Tooltip } from "@mantine/core";
import dayjs from "dayjs";

import styles from "./SearchResults.module.css";

const PAGE_SIZE = 10;

/*
export type SearchResults = {
	data: Array<{
		arena_person_identity_id: UUID;
		asset: {
			size_label: string;
			raw_url: string;
			id: number;
			title: string;
			source: string;
			url: string;
			status_code: number;
			path: string;
			copied: boolean;
			duplicated: boolean;
			file_type: string;
			created_at: DateTime;
			modified_at: DateTime;
		};
		asset_url: string;
		birth_date: string | null;
		created_at: string;
		name: string;
		first_name: string;
		middle_name: string | null;
		last_name: string;
		nickname: string | null;
		title: string;
		short_title: string | null;
		slug: string;
		slug_uri: string;
		status: number;
		status_color: string;
		status_text: string;
		thumbnail_url: string;
		type: string;
		shareable_link: string;
		is_flo_college: boolean;
		gender: "m" | "f" | null;
		high_scrool_grad_year: number;
		id: number;
		location: {
			city: string;
			country: string;
			google_place_id: string;
			id: number;
			lattitude: number;
			longitude: number;
			name: string;
			state: string;
			street: string | null;
			timezone: string | null;
			zip_code: string | null;
		};
		modified_at: string;

	}> | null;
	meta: {
		duration: number;
		limit: number;
		max_limit: number;
		max_pages: number;
		offset: number;
		page: number;
		pages: number;
		sites: number[];
		source: string;
		total: number;
		type: string;
	}
}
*/

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
		const data = await FloAPI.searchByName(name, {
			limit: PAGE_SIZE,
			page,
			onProgress: nprogress.set,
		});
		nprogress.complete();

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
							<Card key={result.arena_person_identity_id} styles={{ root: { textAlign: "left" } }}  p="lg" className={styles.result} onClick={() => navigate(`/athlete/${result.arena_person_identity_id}`)}>
								<Link to={`/athlete/${result.arena_person_identity_id}`} style={{ textDecoration: "none" }}>
									<Group align={"end"}><Title order={3}>{result.name}</Title><Text c="dimmed">ID: {result.arena_person_identity_id}</Text></Group>
									{result.location ?
										<Group>
											<p>{result.location.name} ({result.location.city}, {result.location.state})</p> <Text c="dimmed">{result.location.google_place_id}</Text>
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
				<p>Loading...</p>
			)}
		</div>
	)
}