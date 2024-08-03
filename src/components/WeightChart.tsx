import { ChartTooltip, LineChart, LineChartProps } from "@mantine/charts";
import FloAPI from "../api/FloAPI";
import { EventAttributes } from "../api/types/objects/event";
import { WeightClassObject, WeightClassAttributes } from "../api/types/objects/weightClass";
import { WrestlersResponse } from "../api/types/responses";
import React, { useEffect } from "react";
import { Stack, Title } from "@mantine/core";
import { ContentType } from "recharts/types/component/Tooltip";
import dayjs from "dayjs";

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
					event: event.name,
				};
				setDataMap(prev => {
					prev.set(obj.date, obj);
					return prev;
				});
			}
		});
	}, [data, startDate, endDate]);

	return (
		<LineChart
			title="Weight Chart"
			h={h}
			data={data ? Array.from(dataMap.values()) : []}
			yAxisProps={{ domain: ["dataMin - 10", "dataMax + 10"], ticks: [106, 113, 120, 126, 132, 138, 144, 150, 157, 165, 175, 190, 215, 285] }}
			xAxisProps={{ type: "number", domain: ["dataMin", "dataMax"], scale: "linear", tickFormatter: (v: number) => new Date(v).toLocaleDateString() }}
			dataKey="date"
			connectNulls={false}
			tooltipAnimationDuration={100}
			curveType="monotone"
			tooltipProps={{
				content: (({ label, payload }: { label: string, payload: Record<string, unknown>[] }) => (
					<ChartTooltip
						label={(
							<Stack gap={0}>
								<Title order={4}>{label ? dayjs(label).format("MMMM D, YYYY") : ""}</Title>
								<Title order={5}>{payload.length ? (payload[0].payload as { event: string }).event : ""}</Title>
							</Stack>
						)}
						payload={payload}
						series={[
							{ name: "Weight Class Max", color: "blue" },
							{ name: "Exact Weight", color: "red" },
						]}
						valueFormatter={(v) => v + " lbs"}
						showColor={true}
					/>
				)) as ContentType<string, string>,
			}}
			unit=" lbs"
			series={[
				{ name: "Weight Class Max", color: "blue" },
				{ name: "Exact Weight", color: "red" },
			]}
			{...chartProps}
		/>
	);
}