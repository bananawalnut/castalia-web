import type { ReactNode } from "react";
import "./Badge.css";

export type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "error";

export interface BadgeProps {
  variant?: BadgeVariant;
  children?: ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span className={`zn-badge zn-badge--${variant} ${className}`}>
      {children}
    </span>
  );
}
