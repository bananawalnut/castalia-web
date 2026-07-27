import type { CSSProperties } from "react";
import "./Divider.css";

export type DividerVariant = "default" | "strong";

export interface DividerProps {
  variant?: DividerVariant;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function Divider({
  variant = "default",
  label,
  className = "",
  style,
}: DividerProps) {
  if (label) {
    return (
      <div
        className={`zn-divider zn-divider--labeled ${className}`}
        role="separator"
        style={style}
      >
        <span className="zn-divider__line zn-divider__line--left" />
        <span className="zn-divider__label">{label}</span>
        <span className="zn-divider__line zn-divider__line--right" />
      </div>
    );
  }
  return (
    <hr
      className={`zn-divider zn-divider--${variant} ${className}`}
      style={style}
    />
  );
}
