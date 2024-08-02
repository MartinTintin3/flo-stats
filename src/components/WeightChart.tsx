import { LineChart, LineChartProps } from "@mantine/charts";
import FloAPI from "../api/FloAPI";
import { EventObject, EventAttributes } from "../api/types/objects/event";
import { WeightClassObject, WeightClassAttributes } from "../api/types/objects/weightClass";
import { EventRelationship, WeightClassRelationship } from "../api/types/relationships";
import { WrestlersResponse } from "../api/types/responses";

type WeightChartProps = {
	h: number;
	data?: WrestlersResponse<EventRelationship & WeightClassRelationship, EventObject | WeightClassObject> | null;
	startDate?: Date | null;
	endDate?: Date | null;
	chartProps?: LineChartProps;
}

export default function WeightChart({ h = 400, data, startDate, endDate, chartProps }: WeightChartProps) {
	return (
		<LineChart
			h={h}
			data={data ? data.data.map(wrestler => {
				const event = FloAPI.findIncludedObjectById(wrestler.attributes.eventId, "event", data)?.attributes as EventAttributes;

				if (startDate && new Date(event.startDateTime) < startDate) return null;
				if (endDate && new Date(event.startDateTime) > endDate) return null;

				const weightClass = FloAPI.findIncludedObjectById(wrestler.attributes.weightClassId, "weightClass", data)?.attributes as WeightClassAttributes;
				return {
					date: new Date(event.startDateTime).getTime(),
					"Weight Class Max": weightClass.maxWeight,
					"Exact Weight": wrestler.attributes.exactWeight,
				};
			}).filter(d => d !== null) : []}
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