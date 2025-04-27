import { render as rtlRender } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

// Add providers here if needed
function Providers({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}

function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
	return rtlRender(ui, { wrapper: Providers, ...options });
}

// re-export everything
export * from "@testing-library/react";

// override render method
export { render };
