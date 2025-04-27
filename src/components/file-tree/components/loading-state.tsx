"use client";

import { memo } from "react";

export const LoadingState = memo(() => (
	<div className="flex h-24 items-center justify-center">
		<div className="mr-2 h-6 w-6 animate-spin rounded-full border-neutral-500 border-b-2" />
		Loading files...
	</div>
));
LoadingState.displayName = "LoadingState";
