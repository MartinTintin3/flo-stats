import { Group, CloseButtonProps } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconReload } from "@tabler/icons-react";

export type BoutDateFilterProps = {
	startDate: Date | null;
	endDate: Date | null;
	setStartDate: React.Dispatch<React.SetStateAction<Date | null>>;
	setEndDate: React.Dispatch<React.SetStateAction<Date | null>>;
	oldestBout?: Date;
	newestBout?: Date;
}

export default function BoutDateFilter({ startDate, endDate, setStartDate, setEndDate, oldestBout, newestBout }: BoutDateFilterProps) {
	return (
		<Group justify="center">
			<DateInput
				label="Filter Start Date"
				placeholder="Pick date"
				value={startDate}
				minDate={
					// oldestBout or endDate whichever is later
					(oldestBout && endDate)
						? oldestBout < endDate
							? oldestBout
							: (endDate ?? undefined)
						: oldestBout || (endDate ?? undefined)
				}
				maxDate={
					// newestBout or endDate whichever is earlier
					(newestBout && endDate)
						? newestBout < endDate
							? newestBout
							: (endDate ?? undefined)
						: newestBout || (endDate ?? undefined)
				}
				clearable
				clearButtonProps={{ onClick: () => oldestBout ? setStartDate(oldestBout): {}, icon: <IconReload size={16} />  } as CloseButtonProps as never}
				onChange={setStartDate}
			/>
			<DateInput
				label="Filter End Date"
				placeholder="Pick date"
				value={endDate}
				minDate={
					// oldestBout or startDate whichever is later
					(oldestBout && startDate)
						? oldestBout > startDate
							? oldestBout
							: (startDate ?? undefined)
						: oldestBout || (startDate ?? undefined)
				}
				maxDate={
					// newestBout or startDate whichever is earlier
					(newestBout && startDate)
						? newestBout > startDate
							? newestBout
							: (startDate ?? undefined)
						: newestBout || (startDate ?? undefined)
				}
				clearable
				clearButtonProps={{ onClick: () => newestBout ? setEndDate(newestBout): {}, icon: <IconReload size={16} />  } as CloseButtonProps as never}
				onChange={setEndDate}
			/>
		</Group>
	)
}