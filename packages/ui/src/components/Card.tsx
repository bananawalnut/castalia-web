import type {
  CSSProperties,
  MouseEventHandler,
  KeyboardEventHandler,
  ReactNode,
} from "react";
import "./Card.css";

export type CardVariant = "default" | "elevated" | "glass" | "interactive";

export interface CardProps {
  variant?: CardVariant;
  selected?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function Card({
  variant = "default",
  selected = false,
  children,
  className = "",
  style,
  onClick,
}: CardProps) {
  const isClickable = !!onClick;
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.currentTarget.click();
  };

  return (
    <div
      className={[
        "zn-card",
        `zn-card--${variant}`,
        selected ? "zn-card--selected" : "",
        isClickable ? "zn-card--clickable" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      style={style}
    >
      {children}
    </div>
  );
}
