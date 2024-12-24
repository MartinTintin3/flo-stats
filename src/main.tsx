import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import { createTheme, MantineProvider } from "@mantine/core";
import { NavigationProgress } from "@mantine/nprogress";

import SearchBar from "./components/SearchBar.tsx";

import "./index.css";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/nprogress/styles.css";
import SearchResultsPage from "./components/SearchResults.tsx";

export const ID_REGEX = new RegExp("[0-9(a-f|A-F)]{8}-[0-9(a-f|A-F)]{4}-4[0-9(a-f|A-F)]{3}-[89ab][0-9(a-f|A-F)]{3}-[0-9(a-f|A-F)]{12}"); // UUID v4

const root = document.getElementById("root");

const theme = createTheme({
	primaryColor: "red",
});

ReactDOM.createRoot(root!).render(
	<React.StrictMode>
		<MantineProvider defaultColorScheme="dark" theme={theme}>
			<NavigationProgress />
			<BrowserRouter>
				<SearchBar loading={false} />
				<Routes>
					<Route path="/" element={<App />} />
					<Route path="/athlete/:id" element={<App />} />
					<Route path="/search" element={<SearchResultsPage />} />
				</Routes>
			</BrowserRouter>
		</MantineProvider>
	</React.StrictMode>,
);
