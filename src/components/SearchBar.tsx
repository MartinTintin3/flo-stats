import { Button, Group, TextInput } from "@mantine/core";
import React from "react";
import { ID_REGEX } from "../main";
import { useNavigate } from "react-router";

type Props = {
	loading: boolean;
}

export default function SearchBar({ loading }: Props) {
	const [inputValue, setInputValue] = React.useState("");
	const [inputError, setInputError] = React.useState(false);
	const [inputFocused, setInputFocused] = React.useState<boolean>(false);

	const [initialLoad, setInitialLoad] = React.useState<boolean>(false);

	const searchButtonRef = React.useRef<HTMLButtonElement>(null);

	const navigate = useNavigate();

	React.useEffect(() => {
		if (!initialLoad) {
			setInitialLoad(true);
			const search = new URLSearchParams(window.location.search).get("q");
			if (search) setInputValue(search);

			document.addEventListener("keydown", e => {
				if (e.repeat) return;
				if (e.key === "Enter") {
					searchButtonRef.current?.click();
				}
			});
		}
	});

	React.useEffect(() => {
		if (inputError && inputFocused) setInputError(false);
	}, [inputFocused]);

	const searchFor = async (query: string, useOfp: boolean) => {
		if (!query) {
			// setInputError(true);
		} else {
			const test = ID_REGEX.exec(query);
			if (!test) {
				navigate(`/search?q=${encodeURIComponent(query)}&page=1&ofp=${useOfp}`);
			} else {
				navigate(`/athletes/${test[0]}`);
			}
		}
	};

	return (
		<Group justify="center" mb="xl">
			<TextInput
				value={inputValue}
				name="wrestler-search"
				onChange={e => setInputValue(e.currentTarget.value)}
				placeholder="Enter name or ID..."
				error={inputError}
				onFocus={() => setInputFocused(true)}
				onBlur={() => setInputFocused(false)}
				size="md"
			/>
			<Button
				variant="outline"
				loading={loading}
				onClick={() => {
					searchFor(inputValue, false);
				}}
				ref={searchButtonRef}
			>
				Narrow Search
			</Button>
			<Button
				variant="outline"
				loading={loading}
				onClick={() => {
					searchFor(inputValue, true);
				}}
			>
				Broad Search
			</Button>
		</Group>
	);
}