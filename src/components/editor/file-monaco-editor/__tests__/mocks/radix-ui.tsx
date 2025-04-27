import { forwardRef } from "react";
import type { ReactNode } from "react";
import React from "react";

interface SelectProps {
	children: ReactNode;
	value?: string;
	onValueChange?: (value: string) => void;
}

interface SelectTriggerProps {
	children: ReactNode;
	className?: string;
}

interface SelectValueProps {
	children: ReactNode;
}

interface SelectContentProps {
	children: ReactNode;
}

interface SelectItemProps {
	children: ReactNode;
	value: string;
	onClick?: () => void;
	onKeyDown?: (event: React.KeyboardEvent) => void;
}

interface BreadcrumbProps {
	children: ReactNode;
}

interface BreadcrumbListProps {
	children: ReactNode;
}

interface BreadcrumbItemProps {
	children: ReactNode;
}

interface BreadcrumbLinkProps {
	children: ReactNode;
}

interface BreadcrumbPageProps {
	children: ReactNode;
}

interface ScrollAreaProps {
	children: ReactNode;
}

interface BadgeProps {
	children: ReactNode;
	variant?: string;
	className?: string;
}

// Mock Select components
export const Select = ({ children, value, onValueChange }: SelectProps) => {
	const handleItemClick = (itemValue: string) => {
		onValueChange?.(itemValue);
	};

	// Clone children and inject handleItemClick
	const childrenWithProps = React.Children.map(children, (child) => {
		if (React.isValidElement(child)) {
			if (child.type === SelectContent) {
				return React.cloneElement(
					child as React.ReactElement<SelectContentProps>,
					{
						children: React.Children.map(
							child.props.children,
							(contentChild) => {
								if (
									React.isValidElement(contentChild) &&
									contentChild.type === SelectItem
								) {
									return React.cloneElement(
										contentChild as React.ReactElement<SelectItemProps>,
										{
											onClick: () => handleItemClick(contentChild.props.value),
											onKeyDown: (e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													handleItemClick(contentChild.props.value);
												}
											},
										},
									);
								}
								return contentChild;
							},
						),
					},
				);
			}
		}
		return child;
	});

	return <div data-testid="select">{childrenWithProps}</div>;
};

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
	({ children, ...props }, ref) => (
		<button ref={ref} {...props} data-testid="select-trigger" type="button">
			{children}
		</button>
	),
);

export const SelectValue = ({ children }: SelectValueProps) => (
	<span data-testid="select-value">{children}</span>
);

export const SelectContent = ({ children }: SelectContentProps) => (
	<div data-testid="select-content" role="listbox">
		{children}
	</div>
);

export const SelectItem = ({
	children,
	value,
	onClick,
	onKeyDown,
}: SelectItemProps) => (
	<button
		data-testid="select-item"
		data-value={value}
		onClick={onClick}
		onKeyDown={onKeyDown}
		role="option"
		aria-selected={false}
		tabIndex={0}
		type="button"
	>
		{children}
	</button>
);

// Mock Breadcrumb components
export const Breadcrumb = ({ children }: BreadcrumbProps) => (
	<nav data-testid="breadcrumb">{children}</nav>
);

export const BreadcrumbList = ({ children }: BreadcrumbListProps) => (
	<ol data-testid="breadcrumb-list">{children}</ol>
);

export const BreadcrumbItem = ({ children }: BreadcrumbItemProps) => (
	<li data-testid="breadcrumb-item">{children}</li>
);

export const BreadcrumbLink = ({ children }: BreadcrumbLinkProps) => (
	<button
		data-testid="breadcrumb-link"
		type="button"
		className="text-left"
		onClick={(e) => e.preventDefault()}
	>
		{children}
	</button>
);

export const BreadcrumbPage = ({ children }: BreadcrumbPageProps) => (
	<span data-testid="breadcrumb-page">{children}</span>
);

export const BreadcrumbSeparator = () => (
	<span data-testid="breadcrumb-separator">/</span>
);

// Mock ScrollArea components
export const ScrollArea = ({ children }: ScrollAreaProps) => (
	<div data-testid="scroll-area">{children}</div>
);

// Mock Badge component
export const Badge = ({ children, variant, className }: BadgeProps) => (
	<span data-testid="badge" data-variant={variant} className={className}>
		{children}
	</span>
);
