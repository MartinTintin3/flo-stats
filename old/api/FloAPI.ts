import { BaseResponse, BoutsResponse, NodeResult, SearchResultPerson, SearchResultPersonUseOfp, SearchResults, WrestlersResponse } from "./types/responses";
import { BoutsIncludeString, FloObject, FloObjectTypeString, UUID, WrestlersIncludeString } from "./types/types";
import { Relationship, RelationshipToBout, RelationshipToWrestler } from "./types/relationships";
import { WrestlerObject } from "./types/objects/wrestler";
import { BoutObject } from "./types/objects/bout";

export type FetchConfig = {
	pageSize: number;
	pageOffset: number;
	onProgress?: (progress: number) => void;
}

export type SearchResultsTyped<O extends boolean> = O extends true ? SearchResults<SearchResultPersonUseOfp> : SearchResults<SearchResultPerson>;

export default class FloAPI {
	public static searchByName<T extends boolean>(name: string, { limit, page, onProgress, useOfp }: { limit: number, page: number, onProgress: (v: number) => void, useOfp: T }): Promise<SearchResultsTyped<T>> {
		return this.fetchWithProgress<SearchResultsTyped<T>>(`https://api.flowrestling.org/api/experiences/web/legacy-core/search?site_id=2&version=1.33.2&limit=${limit}&view=global-search-web&fields=data%3C1%3E&q=${encodeURIComponent(name)}&page=${page}&type=person` + (useOfp ? "&useOfp=true" : ""), onProgress);
	}

	public static fetchWithProgress<T>(url: string, onProgress?: (progress: number) => void): Promise<T> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);
			xhr.addEventListener("progress", e => {
				if (e.lengthComputable && onProgress) onProgress((e.loaded / e.total) * 100);
			});
			xhr.addEventListener("load", () => {
				if (onProgress) onProgress(100);
				resolve(JSON.parse(xhr.responseText) as T);
			});
			xhr.addEventListener("error", reject);
			xhr.send();
		});
	}

	public static fetchWithProgressTyped<O extends FloObject, R extends Relationship | void, I = Exclude<FloObject, O> | void>(url: string, onProgress?: (progress: number) => void): Promise<BaseResponse<O, R, I>> {
		return this.fetchWithProgress<BaseResponse<O, R, I>>(url, onProgress);
	}

	public static fetchWrestlersByAthleteId<R extends RelationshipToWrestler | void, I extends Exclude<FloObject, WrestlerObject> | void>(athleteId: UUID, config: FetchConfig, include: readonly WrestlersIncludeString[] = ["bracketPlacements.weightClass", "division", "event", "weightClass", "team"], extra?: string): Promise<WrestlersResponse<R, I>> {
		return this.fetchWithProgressTyped<WrestlerObject, R, I>(`https://floarena-api.flowrestling.org/wrestlers/?identityPersonId=${athleteId}&orderBy=eventEndDateTime&orderDirection=desc&page[size]=${config.pageSize}&page[offset]=${config.pageOffset}` + (include.length ? `&include=${include.join(",")}` : "") + (extra ?? ""), config.onProgress);
	}

	public static fetchBouts<R extends RelationshipToBout | void, I extends Exclude<FloObject, BoutObject> | void>(athleteId: UUID, config: FetchConfig, include: readonly BoutsIncludeString[] = ["bottomWrestler.team", "topWrestler.team", "weightClass", "topWrestler.division", "bottomWrestler.division", "event","roundName"], extra?: string): Promise<BoutsResponse<R, I>> {
		return this.fetchWithProgressTyped<BoutObject, R, I>(`https://floarena-api.flowrestling.org/bouts/?identityPersonId=${athleteId}&page[size]=${config.pageSize}&page[offset]=${config.pageOffset}&hasResult=true` + (include.length ? `&include=${include.join(",")}` : "") + (extra ?? ""), config.onProgress);
	}

	public static fetchWrestlersByWeightClass<R extends RelationshipToWrestler | void, I extends Exclude<FloObject, WrestlerObject> | void>(weightClassId: UUID, config: FetchConfig, include: readonly string[] = [], extra?: string): Promise<WrestlersResponse<R, I>> {
		return this.fetchWithProgressTyped<WrestlerObject, R, I>(`https://floarena-api.flowrestling.org/wrestlers/?weightClassId=${weightClassId}&page[size]=${config.pageSize}&page[offset]=${config.pageOffset}` + (include.length ? `&include=${include.join(",")}` : "") + (extra ?? ""),);
	}

	public static fetchFromNode(node: number, onProgress?: (progress: number) => void) {
		return this.fetchWithProgress<NodeResult>(`https://api.flowrestling.org/api/collections/from-node/${node}`, onProgress);
	}

	public static findIncludedObjectById<T extends FloObject>(id: UUID, type: FloObjectTypeString, res: BaseResponse<FloObject, Relationship | void, FloObject>) {
		return res.included.find(i => i.type == type && i.id == id) as T | undefined;
	}
}