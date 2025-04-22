"use client";

import { useCallback, useState } from "react";

export interface EnvVar {
	key: string;
	value: string;
}

export function useEnvVars() {
	const [envVars, setEnvVars] = useState<EnvVar[]>([]);

	const addEnvVar = useCallback((key: string, value: string) => {
		setEnvVars((prev) => {
			const exists = prev.findIndex((env) => env.key === key);
			if (exists >= 0) {
				const updated = [...prev];
				updated[exists] = { key, value };
				return updated;
			}
			return [...prev, { key, value }];
		});
	}, []);

	const applyEnvVars = useCallback(
		(command: string): string => {
			let result = command;
			for (const env of envVars) {
				// Replace any instances of $KEY or ${KEY} with the value
				result = result.replace(
					new RegExp(`\\$${env.key}|\\$\{${env.key}\}`, "g"),
					env.value,
				);
			}
			return result;
		},
		[envVars],
	);

	const removeEnvVar = useCallback((key: string) => {
		setEnvVars((prev) => prev.filter((env) => env.key !== key));
	}, []);

	return {
		envVars,
		addEnvVar,
		applyEnvVars,
		removeEnvVar,
	};
}
