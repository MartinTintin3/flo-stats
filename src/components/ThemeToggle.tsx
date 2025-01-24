import { ActionIcon, ActionIconProps, useMantineColorScheme, useMantineTheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export default function ThemeToggle(props: ActionIconProps) {
	const { colorScheme, setColorScheme } = useMantineColorScheme();
	const theme = useMantineTheme();

	const toggle = () => {
		setColorScheme(colorScheme === "dark" ? "light" : "dark");
	};

	return (
		<ActionIcon {...props} onClick={toggle} color={theme.primaryColor}>
			{colorScheme === "dark" ? <IconSun /> : <IconMoon />}
		</ActionIcon>
	);
}