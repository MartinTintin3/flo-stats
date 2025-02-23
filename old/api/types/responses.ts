import { BoutObject } from "./objects/bout";
import { WrestlerObject } from "./objects/wrestler";
import { Relationship, RelationshipToBout, RelationshipToWrestler } from "./relationships";
import { DateTime, FloObject, Nothing, UUID } from "./types";

// Base response
export type BaseResponse<O extends FloObject, R extends Relationship | void, I = Exclude<FloObject, O> | void> = {
	data: Array<O & (R extends void ? Nothing : { relationships: R })>;
	meta: {
		total: number;
	}
	links?: {
		first: string;
		last?: string;
		next?: string;
		prev?: string;
	},
} & ([I] extends [void] ? Nothing : { included: Array<I> });

export type BoutsResponse<R extends RelationshipToBout | void, I extends Exclude<FloObject, BoutObject> | void> = BaseResponse<BoutObject, R, I>;
export type WrestlersResponse<R extends RelationshipToWrestler | void, I extends Exclude<FloObject, WrestlerObject> | void> = BaseResponse<WrestlerObject, R, I>;

export type NodeResult = {
	meta: {
		page: number;
		pages: number;
		limit: number;
		total: number;
		max_pages: number;
		max_limit: number;
		source: string;
		duration: number;
		sites: number[];
		type: string;
		extra: any;
	};
	data: {
		asset_url: string;
		thumbnail_url: string;
		should_show_read_more: boolean;
		drill_through_link: string | null;
		meta_collections_page_title: string;
        meta_collections_page_description: string;
        meta_collections_videos_page_title: string;
        meta_collections_videos_page_description: string;
        meta_collections_entries_page_title: string;
        meta_collections_entries_page_description: string;
        meta_collections_schedule_page_title: string;
        meta_collections_schedule_page_description: string;
        meta_collections_news_page_title: string;
        meta_collections_news_page_description: string;
		metadata_filters: {
			id: number;
			type: string;
		}[];
		aggregated_node_ids: number[];
		title: string;
		short_title: string;
		code: any;
		arena_person_identity_id: UUID;
		slug: string;
		slug_uri: string;
		original_entity: SearchResultPerson;
	}
}

export type SearchResultPerson = {
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
	node: {
		id: number;
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
	high_school_grad_year: number;
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
}

export type SearchResultPersonUseOfp = {
	asset_url: string;
	duration: number;
	id: string;
	modified_at: string;
	node: {
		id: number;
	};
	premium: boolean;
	publish_start_date: string;
	slug_uri: string;
	title: string;
	type: "person";
}

export type SearchResults<D extends SearchResultPerson | SearchResultPersonUseOfp> = {
	data: Array<D> | null;
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
		extra: [
			{
				response: {
					ids: {
						person: string[];
					},
					sortSeq: {
						[personId: string]: number;
					}
				}
			}
		]
	}
}