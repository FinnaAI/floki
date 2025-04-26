import { forwardRef, useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Input } from "./input";

export const AutoFocusInput = forwardRef<
	HTMLInputElement,
	ComponentPropsWithoutRef<typeof Input> & { selectAll?: boolean }
>((props, ref) => {
	const { selectAll = false, ...rest } = props;
	const inputRef = useRef<HTMLInputElement>(null);
	const resolvedRef = ref || inputRef;

	useEffect(() => {
		if ((resolvedRef as React.RefObject<HTMLInputElement>).current) {
			const input = (resolvedRef as React.RefObject<HTMLInputElement>).current;
			input?.focus();

			if (selectAll && input) {
				input.select();
			} else if (input?.value) {
				// Select part before extension
				const lastDotIndex = input.value.lastIndexOf(".");
				if (lastDotIndex > 0) {
					input.setSelectionRange(0, lastDotIndex);
				}
			}
		}
	}, [resolvedRef, selectAll]);

	return <Input ref={resolvedRef} {...rest} />;
});

AutoFocusInput.displayName = "AutoFocusInput";
