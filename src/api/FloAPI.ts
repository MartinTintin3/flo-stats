import axios, { AxiosRequestConfig } from "axios";

import { BaseResponse, BoutsResponse, SearchResults, WrestlersResponse } from "./types/responses";
import { BoutsIncludeString, FloObject, FloObjectTypeString, UUID, WrestlersIncludeString } from "./types/types";
import { Relationship, RelationshipToBout, RelationshipToWrestler } from "./types/relationships";
import { WrestlerObject } from "./types/objects/wrestler";
import { BoutObject } from "./types/objects/bout";

export type PageConfig = {
	pageSize: number;
	pageOffset: number;
}

const defaultPageConfig: PageConfig = {
	pageSize: 0,
	pageOffset: 0
};

export default class FloAPI {
	public static searchByName(name: string, config?: AxiosRequestConfig) {
		return axios.get<SearchResults>(`https://api.flowrestling.org/api/experiences/web/legacy-core/search?site_id=2&version=1.24.0&limit=200&view=global-search-web&fields=data%3C1%3E&q=${encodeURIComponent(name)}&page=1&type=person`, config);
	}

	public static fetchWrestlersByAthleteId<R extends RelationshipToWrestler | void, I extends Exclude<FloObject, WrestlerObject> | void>(athleteId: UUID, pageConfig: PageConfig = defaultPageConfig, config?: AxiosRequestConfig, include: WrestlersIncludeString[] = ["bracketPlacements.weightClass", "division", "event", "weightClass", "team"], extra?: string) {
		return axios.get<WrestlersResponse<R, I>>(`https://floarena-api.flowrestling.org/wrestlers/?identityPersonId=${athleteId}&page[size]=${pageConfig.pageSize}&page[offset]=${pageConfig.pageOffset}` + (include.length ? `&include=${include.join(",")}` : "") + (extra ?? ""), config);
	}

	public static fetchBouts<R extends RelationshipToBout | void, I extends Exclude<FloObject, BoutObject> | void>(athleteId: UUID, pageConfig: PageConfig = defaultPageConfig, config?: AxiosRequestConfig, include: BoutsIncludeString[] = ["bottomWrestler.team", "topWrestler.team", "weightClass", "topWrestler.division", "bottomWrestler.division", "event","roundName"], extra?: string) {
		return axios.get<BoutsResponse<R, I>>(`https://floarena-api.flowrestling.org/bouts/?identityPersonId=${athleteId}&page[size]=${pageConfig.pageSize}&page[offset]=${pageConfig.pageOffset}` + (include.length ? `&include=${include.join(",")}` : "") + (extra ?? ""), config);
	}

	public static fetchWrestlersByWeightClass(weightClassId: UUID, pageConfig: PageConfig = defaultPageConfig, config?: AxiosRequestConfig, include: string[] = [], extra?: string) {
		return axios.get<FloObject>(`https://floarena-api.flowrestling.org/wrestlers/?weightClassId=${weightClassId}&page[size]=${pageConfig.pageSize}&page[offset]=${pageConfig.pageOffset}` + (include.length ? `&include=${include.join(",")}` : "") + (extra ?? ""), config);
	}

	public static findIncludedObjectById(id: UUID, type: FloObjectTypeString,res: BaseResponse<FloObject, Relationship, FloObject>) {
		return res.included.find(i => i.type == type && i.id == id);
	}
}