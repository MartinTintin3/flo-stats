import React, { useEffect } from "react";
import {
	LineChart,
	Line,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	ReferenceArea,
	ResponsiveContainer,
} from "recharts";
import FloAPI from "../api/FloAPI";
import { EventAttributes } from "../api/types/objects/event";
import { WeightClassAttributes, WeightClassObject } from "../api/types/objects/weightClass";
import { WrestlersResponse } from "../api/types/responses";
import { ChartTooltip } from "@mantine/charts";
import { ContentType } from "recharts/types/component/Tooltip";
import { Stack, Title } from "@mantine/core";
import dayjs from "dayjs";


type WeightChartProps = {
	h: number;
	data?: WrestlersResponse<void, WeightClassObject> | null;
	startDate?: Date | null;
	endDate?: Date | null;
}

export default function HighlightAndZoomLineChart(props: WeightChartProps) {
	const [data, setData] = React.useState<{ date: number, "Weight Class": number, "Exact Weight": number }[]>([]);
	const [left, setLeft] = React.useState<string | number>("dataMin");
	const [right, setRight] = React.useState<string | number>("dataMax");
	const [refAreaLeft, setRefAreaLeft] = React.useState<string | number>("");
	const [refAreaRight, setRefAreaRight] = React.useState<string | number>("");
	const [top, setTop] = React.useState<string | number>("dataMax+1");
	const [bottom, setBottom] = React.useState<string | number>("dataMin-1");

	useEffect(() => {
		const result = new Map();
		if (props.data && props.data.data) {
			props.data.data.forEach(wrestler => {
				const event = FloAPI.findIncludedObjectById(wrestler.attributes.eventId, "event", props.data as any)?.attributes as EventAttributes;

				if (props.startDate && new Date(event.startDateTime) < props.startDate) return;
				if (props.endDate && new Date(event.startDateTime) > props.endDate) return;

				const weightClass = FloAPI.findIncludedObjectById(wrestler.attributes.weightClassId, "weightClass", props.data as any)?.attributes as WeightClassAttributes;
				if (weightClass) {

					//console.log(weightClass.name, weightClass.maxWeight);
					const obj = {
						date: new Date(event.startDateTime).getTime(),
						"Weight Class": isNaN(weightClass.name.split(" ")[0] as unknown as number) ? weightClass.maxWeight : parseInt(weightClass.name.split(" ")[0]),
						"Exact Weight": (wrestler.attributes.exactWeight ?? parseInt(weightClass.name.split(" ")[0])) || weightClass.maxWeight,
						event: event.name,
					};
					result.set(obj.date, obj);
				}
			});
		}
		setData(Array.from(result.values()));
		zoomOut();
	}, [props.data, props.startDate, props.endDate]);

	const getAxisYDomain = (from: number, to: number, ref: string, offset: number) => {
		from = data.findIndex(e => e.date === from);
		to = data.findIndex(e => e.date === to);
		const refData = data.slice(from, to);
		console.log(refData);
		let [bottom, top] = [(refData[0] as any)[ref], (refData[0] as any)[ref]];
		refData.forEach((d: any) => {
			if (d[ref] > top) top = d[ref];
			if (d[ref] < bottom) bottom = d[ref];
		});

		return [(bottom | 0) - offset, (top | 0) + offset];
	};

	const zoom = () => {

		if (refAreaLeft === refAreaRight || refAreaRight === "") {
			setRefAreaLeft("");
			setRefAreaRight("");
			return;
		}

		let left = refAreaLeft;
		let right = refAreaRight;

		// xAxis domain
		if (refAreaLeft > refAreaRight) {
			console.log("swap");
			// swap value
			console.log(left, right);
			const temp = left;
			left = right;
			right = temp;
			console.log(left, right);
		}

		// yAxis domain
		const [bottom, top] = getAxisYDomain(left as number, right as number, "Exact Weight", 1);
		//const [bottom2, top2] = getAxisYDomain(refAreaLeft, refAreaRight, "Weight Class", 50);
		console.log(bottom, top);

		setBottom(bottom);
		setTop(top);
		setRefAreaLeft("");
		setRefAreaRight("");
		setData(data.slice());
		setLeft(refAreaLeft);
		setRight(refAreaRight);
	};

	const zoomOut = () => {
		setData(data.slice());
		setRefAreaLeft("");
		setRefAreaRight("");
		setLeft("dataMin");
		setRight("dataMax");
		setTop("dataMax+1");
		setBottom("dataMin");
		setBottom(Math.min(...data.map(d => d["Weight Class"])) - 10);
		setTop(Math.max(...data.map(d => d["Weight Class"])) + 10);
	};

	return (
		<div className="highlight-bar-charts" style={{ userSelect: "none", width: "100%" }}>
			<button type="button" className="btn update" onClick={() => zoomOut()}>
        Zoom Out
			</button>

			<ResponsiveContainer width="100%" height={400}>
				<LineChart
					width={800}
					height={400}
					data={data}
					onMouseDown={(e) => setRefAreaLeft(e.activeLabel as any as number)}
					onMouseMove={(e) => refAreaLeft && setRefAreaRight(e.activeLabel as any as number)}
					// eslint-disable-next-line react/jsx-no-bind
					onMouseUp={() => zoom()}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="rgb(255, 255, 2555, 0.1)" />
					<XAxis allowDataOverflow dataKey="date" domain={[left, right]} type="number" tickFormatter={(v: number) => new Date(v).toLocaleDateString()} />
					<YAxis padding={{ top: 15 }} tickLine={{strokeOpacity:0.1}} allowDataOverflow domain={[bottom, top]} type="number" tickCount={14} interval={0} ticks={[106, 113, 120, 126, 132, 138, 144, 150, 157, 165, 175, 190, 215, 285]} unit=" lbs" />
					<Tooltip content={
						(({ label, payload }: { label: string, payload: Record<string, unknown>[] }) => (
							<ChartTooltip
								label={(
									<Stack gap={0}>
										<Title order={4}>{label ? dayjs(label).format("MMMM D, YYYY") : ""}</Title>
										<Title order={5}>{payload.length ? (payload[0].payload as { event: string }).event : ""}</Title>
									</Stack>
								)}
								payload={payload}
								series={[
									/*{ name: "Weight Class", color: "blue" },*/
									{ name: "Exact Weight", color: "red" },
								]}
								valueFormatter={(v: number) => v + " lbs"}
								showColor={true}
							/>
						)) as ContentType<string, string>
					} />
					<Line type="monotone" dataKey="Exact Weight" stroke="#8884d8" animationDuration={300} />
					<Line type="linear" dataKey="Weight Class" stroke="#82ca9d" animationDuration={300} />

					{refAreaLeft && refAreaRight ? (
						<ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
					) : null}
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
