import { LineChart, LineChartProps } from "@mantine/charts";
import FloAPI from "../api/FloAPI";
import { EventAttributes } from "../api/types/objects/event";
import { WeightClassObject, WeightClassAttributes } from "../api/types/objects/weightClass";
import { WrestlersResponse } from "../api/types/responses";
import React, { useEffect } from "react";

type WeightChartProps = {
	h: number;
	data?: WrestlersResponse<void, WeightClassObject> | null;
	startDate?: Date | null;
	endDate?: Date | null;
	chartProps?: LineChartProps;
}

export default function WeightChart({ h = 400, data, startDate, endDate, chartProps }: WeightChartProps) {
	const [dataMap, setDataMap] = React.useState<Map<number, { date: number, "Weight Class Max": number, "Exact Weight": number }>>(new Map());

	useEffect(() => {
		setDataMap(new Map());
		data?.data.forEach(wrestler => {
			const event = FloAPI.findIncludedObjectById(wrestler.attributes.eventId, "event", data)?.attributes as EventAttributes;

			if (startDate && new Date(event.startDateTime) < startDate) return;
			if (endDate && new Date(event.startDateTime) > endDate) return;

			const weightClass = FloAPI.findIncludedObjectById(wrestler.attributes.weightClassId, "weightClass", data)?.attributes as WeightClassAttributes;
			if (weightClass) {
				const obj = {
					date: new Date(event.startDateTime).getTime(),
					"Weight Class Max": weightClass.maxWeight,
					"Exact Weight": wrestler.attributes.exactWeight,
				};
				setDataMap(prev => {
					prev.set(obj.date, obj);
					return prev;
				});
			}
		});
	}, [data, startDate, endDate]);

	useEffect(() => {
		console.log(dataMap);
	}, [dataMap]);

	return (
		<LineChart
			title="Weight Chart"
			h={h}
			data={data ? Array.from(dataMap.values()) : []}
			yAxisProps={{ domain: ["dataMin - 10", "dataMax + 10"] }}
			xAxisProps={{ type: "number", allowDataOverflow: true, domain: ["dataMin", "dataMax"], scale: "linear", tickFormatter: (v: number) => new Date(v).toLocaleDateString() }}
			dataKey="date"
			connectNulls={false}
			valueFormatter={(value) => value + " lbs"}
			series={[
				{ name: "Weight Class Max", color: "blue" },
				{ name: "Exact Weight", color: "red" },
			]}
			curveType="linear"
			{...chartProps}
		/>
	);
}