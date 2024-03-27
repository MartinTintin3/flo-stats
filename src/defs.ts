export enum Progress {
	None = 0,
	Loading = 1,
	Loaded = 2,
}

export enum DownloadingState {
	CHECKING = 0,
	BOUTS = 1,
	PLACEMENTS = 2,
}

export enum SearchingState {
	NONE = 0,
	SEARCHING = 1,
	PROCESSING = 2,
}

export type Ratio = [number, number];

export type Grade = { name: string; number: number; };

export interface Stats {
	total: number;
	wins: number;
	losses: number;
	pins: number;
	techs: number;
	ratio: Ratio;
}
export interface PlacementInfo {
	placement: string;
	event: {
		id: string;
		name: string;
		date: string;
	}
	division: string;
	weight_class: string;
}

export interface Match {
	id: string;
	event: {
		id: string;
		name: string;
	};
	date: string;
	opponent: {
		id: string;
		name: string;
		team: {
			name: string;
			state: string;
		}
	} | null;
	weight_class: string;
	division: string;
	round: string;
	result: string;
	win: boolean;
}

export interface Wrestler {
	id: string;
	firstName: string;
	lastName: string;
	grade: Grade | null;
	location: {
		city: string;
		country: string;
		state: string;
	};
	total_stats: Stats;
	seasons: Array<{
		season: string;
		stats: Stats;
		placements: Array<PlacementInfo>,
		matches: Array<Match>;
		grade: Grade | null;
	}>;
}

export interface Data {
	response_size: number;
	wrestler: Wrestler | null;
}

/**
 * Calculate ratio of wins to losses
 * @return {Ratio}
 * @param {number} wins
 * @param {number} losses
 */
export function ratio(wins: number, losses: number): Ratio {
	/**
	 * @param {number} a
	 * @param {number} b
	 * @return {number}
	 */
	const get_gcd = (a: number, b: number): number => {
		return b ? get_gcd(b, a % b) : a;
	};

	if (wins == 0) return [0, losses];
	if (losses == 0) return [wins, 0];

	const gcd = get_gcd(wins,losses);
	return [wins / gcd, losses / gcd];
}

/**
 * Format bytes as human-readable text.
 * 
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use 
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 * 
 * @return Formatted string.
 */
export function humanFileSize(bytes: number, si = false, dp = 1): string {
	const thresh = si ? 1000 : 1024;
  
	if (Math.abs(bytes) < thresh) return bytes + " B";
  
	const units = si 
		? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"] 
		: ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
	let u = -1;
	const r = 10 ** dp;
  
	do {
		bytes /= thresh;
		++u;
	} while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

	return bytes.toFixed(dp) + " " + units[u];
}

export function getWithProgress(url: string, headers: Headers, onProgress: (loaded: number, total: number) => void): Promise<any> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.responseType = "json";

		xhr.onprogress = (event) => {
			if (event.lengthComputable) {
				onProgress(event.loaded, event.total);
			}
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(xhr.response);
			} else {
				reject(new Error(`HTTP status ${xhr.status}`));
			}
		};

		xhr.open("GET", url, true);
		headers.forEach((value, key) => {
			xhr.setRequestHeader(key, value);
		});
		xhr.send();
	});
}

export function getIncludedObject(data: any, type: string, id: string): any {
	if (!id) return null;
	return data.included.find((x: any) => x.type == type && x.id == id);
}