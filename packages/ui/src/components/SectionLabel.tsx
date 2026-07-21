import type { ReactNode } from "react";
import "./SectionLabel.css";

export type SectionLabelVariant = "eyebrow" | "marker" | "atom";

export interface SectionLabelProps {
  variant?: SectionLabelVariant;
  children?: ReactNode;
  className?: string;
}

export function SectionLabel({
  variant = "marker",
  children,
  className = "",
}: SectionLabelProps) {
  return (
    <span className={`sl-label sl-label--${variant} ${className}`}>
      {children}
    </span>
  );
}
