import React, { PureComponent, useEffect } from 'react';
import {
  Label,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import FloAPI from '../api/FloAPI';
import { EventAttributes } from '../api/types/objects/event';
import { WeightClassAttributes, WeightClassObject } from '../api/types/objects/weightClass';
import { WrestlersResponse } from '../api/types/responses';
import { ChartTooltip } from '@mantine/charts';
import { ContentType } from 'recharts/types/component/Tooltip';
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
  const [left, setLeft] = React.useState('dataMin');
  const [right, setRight] = React.useState('dataMax');
  const [refAreaLeft, setRefAreaLeft] = React.useState("");
  const [refAreaRight, setRefAreaRight] = React.useState("");
  const [top, setTop] = React.useState('dataMax+1');
  const [bottom, setBottom] = React.useState('dataMin-1');
  const [top2, setTop2] = React.useState('dataMax+20');
  const [bottom2, setBottom2] = React.useState('dataMin-20');
  const [animation, setAnimation] = React.useState(true);

  useEffect(() => {
    const result = new Map();
    if (props.data && props.data.data) {
      props.data.data.forEach(wrestler => {
        const event = FloAPI.findIncludedObjectById(wrestler.attributes.eventId, "event", props.data)?.attributes as EventAttributes;
  
        if (props.startDate && new Date(event.startDateTime) < props.startDate) return;
        if (props.endDate && new Date(event.startDateTime) > props.endDate) return;
  
        const weightClass = FloAPI.findIncludedObjectById(wrestler.attributes.weightClassId, "weightClass", props.data)?.attributes as WeightClassAttributes;
        if (weightClass) {

          console.log(weightClass.name, weightClass.maxWeight);
          const obj = {
            date: new Date(event.startDateTime).getTime(),
            "Weight Class": isNaN(weightClass.name.split(" ")[0]) ? weightClass.maxWeight : parseInt(weightClass.name.split(" ")[0]),
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

  const getAxisYDomain = (from, to, ref, offset) => {
    from = data.findIndex(e => e.date === from);
    to = data.findIndex(e => e.date === to);
    const refData = data.slice(from, to);
    console.log(refData);
    let [bottom, top] = [refData[0][ref], refData[0][ref]];
    refData.forEach((d) => {
      if (d[ref] > top) top = d[ref];
      if (d[ref] < bottom) bottom = d[ref];
    });
  
    return [(bottom | 0) - offset, (top | 0) + offset];
  };

  const zoom = () => {

    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
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
    const [bottom, top] = getAxisYDomain(left, right, "Exact Weight", 1);
    //const [bottom2, top2] = getAxisYDomain(refAreaLeft, refAreaRight, "Weight Class", 50);
    console.log(bottom, top);

    setBottom(bottom);
    setTop(top);
    setRefAreaLeft('');
    setRefAreaRight('');
    setData(data.slice());
    setLeft(refAreaLeft);
    setRight(refAreaRight);
  }

  const zoomOut = () => {
    setData(data.slice());
    setRefAreaLeft('');
    setRefAreaRight('');
    setLeft('dataMin');
    setRight('dataMax');
    setTop('dataMax+1');
    setBottom('dataMin');
    setTop2('dataMax+50');
    setBottom2('dataMin+50');
    setBottom(Math.min(...data.map(d => d["Weight Class"])) - 10);
    setTop(Math.max(...data.map(d => d["Weight Class"])) + 10);
  }

  return (
    <div className="highlight-bar-charts" style={{ userSelect: 'none', width: '100%' }}>
      <button type="button" className="btn update" onClick={() => zoomOut()}>
        Zoom Out
      </button>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          width={800}
          height={400}
          data={data}
          onMouseDown={(e) => setRefAreaLeft(e.activeLabel)}
          onMouseMove={(e) => refAreaLeft && setRefAreaRight(e.activeLabel)}
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
                valueFormatter={(v) => v + " lbs"}
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
