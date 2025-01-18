import { FloatingIndicator, UnstyledButton } from "@mantine/core";
import React from "react";

import styles from "./CarouselFloatingIndicators.module.css";


export type CarouselFloatingIndicatorsProps = {
	indicators: string[]
	setActive: (index: number) => void;
	active: number;
};

export default function CarouselFloatingIndicators({ active, setActive, indicators }: CarouselFloatingIndicatorsProps) {
	const [rootRef, setRootRef] = React.useState<HTMLDivElement | null>(null);
	const [controlsRefs, setControlsRefs] = React.useState<Record<string, HTMLButtonElement | null>>({});

	const setControlRef = (index: number) => (node: HTMLButtonElement) => {
		controlsRefs[index] = node;
		setControlsRefs(controlsRefs);
	};

	const controls = indicators.map((item, index) => (
		<UnstyledButton
			key={item}
			className={styles.control}
			ref={setControlRef(index)}
			onClick={() => setActive(index)}
			mod={{ active: active === index }}
			px="lg"
			py="sm"
		>
			<span className={styles.controlLabel}>{item}</span>
		</UnstyledButton>
	));

	return (
		<div className={styles.root} ref={setRootRef}>
			{controls}

			<FloatingIndicator
				target={controlsRefs[active]}
				parent={rootRef}
				className={styles.indicator}
			/>
		</div>
	);
}