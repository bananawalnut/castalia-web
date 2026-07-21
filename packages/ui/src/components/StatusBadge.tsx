import type { HTMLAttributes } from "react";
import "./StatusBadge.css";

export type StatusBadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "warm";

export interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  meta?: string;
  tone?: StatusBadgeTone;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  label,
  meta,
  tone = "neutral",
  showDot = true,
  className = "",
  ...props
}: StatusBadgeProps) {
  const readableLabel = meta ? `${label}: ${meta}` : label;

  return (
    <div
      className={`zn-status-badge zn-status-badge--${tone} ${className}`}
      aria-label={readableLabel}
      {...props}
    >
      {showDot && <span className="zn-status-badge__dot" aria-hidden="true" />}
      <span className="zn-status-badge__label">{label}</span>
      {meta && <span className="zn-status-badge__meta">{meta}</span>}
    </div>
  );
}
