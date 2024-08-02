const FloURLS = {
	searchByName: (name: string) => `https://api.flowrestling.org/api/experiences/web/legacy-core/search?site_id=2&version=1.24.0&limit=200&view=global-search-web&fields=data%3C1%3E&q=${encodeURIComponent(name)}&page=1&type=person`,
	fetchBasicInfo: (id: string) => `https://floarena-api.flowrestling.org/bouts/?identityPersonId=${id}&page[size]=1&page[offset]=0&include=topWrestler,bottomWrestler`,
	fetchBouts: (id: string, pageSize: number, offset: number = 0) => `https://floarena-api.flowrestling.org/bouts/?identityPersonId=${id}&page[size]=${pageSize}&page[offset]=${offset}&include=bottomWrestler.team,topWrestler.team,weightClass,topWrestler.division,bottomWrestler.division,event,roundName`,
	fetchPlacements: (id: string) => `https://floarena-api.flowrestling.org/wrestlers/?identityPersonId=${id}&page[size]=0&page[offset]=0&include=bracketPlacements.weightClass,division,event,weightClass,team`,

};

export default FloURLS;