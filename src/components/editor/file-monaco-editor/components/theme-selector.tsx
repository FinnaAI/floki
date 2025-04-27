import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import React from "react";

interface ThemeSelectorProps {
	currentTheme: string;
	availableThemes: string[];
	onThemeChange: (theme: string) => void;
}

export const ThemeSelector = React.memo(
	({ currentTheme, availableThemes, onThemeChange }: ThemeSelectorProps) => {
		return (
			<Select value={currentTheme} onValueChange={onThemeChange}>
				<SelectTrigger className="h-7 text-xs">
					<SelectValue placeholder="Select theme" />
				</SelectTrigger>
				<SelectContent>
					{availableThemes.map((theme) => (
						<SelectItem key={theme} value={theme}>
							{theme}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		);
	},
);

ThemeSelector.displayName = "ThemeSelector";
