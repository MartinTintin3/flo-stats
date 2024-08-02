import { BoutObject } from "./objects/bout";
import { WrestlerObject } from "./objects/wrestler";
import { UUID } from "./types";

export type SearchResults = {
	data: Array<{
		arena_person_identity_id: UUID;
		asset: any; // TODO
		asset_url: string;
		birth_date: string;
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
		gender: "m" | "f";
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

export type BaseResponse<Data, Included> = {
	data: Array<Data>
	meta: {
		total: number;
	}
	link: {
		first: string;
		last?: string;
		next?: string;
		prev?: string;
	},
	included: Array<Included>;
}

export type BoutsResponse<Relationships, Included> = BaseResponse<BoutObject & Relationships, Included>;
export type WrestlersResponse<Relationships, Included> = BaseResponse<WrestlerObject & Relationships, Included>;