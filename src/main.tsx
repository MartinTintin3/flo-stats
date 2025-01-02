import React from "react";
import ReactDOM from "react-dom/client";
import Athletes from "./Athletes.tsx";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router";
import { createTheme, MantineProvider } from "@mantine/core";
import { NavigationProgress } from "@mantine/nprogress";

import SearchBar from "./components/SearchBar.tsx";

import "./index.css";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/nprogress/styles.css";
import "@mantine/carousel/styles.css";
import "mantine-react-table/styles.css";

import SearchResultsPage from "./components/SearchResults.tsx";

export const ID_REGEX = new RegExp("[0-9(a-f|A-F)]{8}-[0-9(a-f|A-F)]{4}-4[0-9(a-f|A-F)]{3}-[89ab][0-9(a-f|A-F)]{3}-[0-9(a-f|A-F)]{12}"); // UUID v4

const root = document.getElementById("root");

const theme = createTheme({
	primaryColor: "blue",
	colors: {
		blue: [
			"#e5f3ff",
			"#cde2ff",
			"#9ac2ff",
			"#64a0ff",
			"#3884fe",
			"#1d72fe",
			"#0969ff",
			"#0058e4",
			"#004ecd",
			"#0043b5"
		],
	}
});


ReactDOM.createRoot(root!).render(
	<React.StrictMode>
		<MantineProvider defaultColorScheme="dark" theme={theme}>
			<NavigationProgress />
			<BrowserRouter>
				<SearchBar loading={false} />
				{/*<ThemeToggle styles={{ root: {
					position: "absolute",
					top: 0,
					right: 0,
					margin: "2rem",
				} }} size="lg" />*/}
				<Routes>
					<Route path="/" element={<></>} />
					<Route path="/search" element={<SearchResultsPage />} />
					<Route path="/athletes/:id" element={<Athletes />} />
					<Route path="/teams/:id" element={<Athletes />} />
				</Routes>
			</BrowserRouter>
		</MantineProvider>
	</React.StrictMode>,
);
