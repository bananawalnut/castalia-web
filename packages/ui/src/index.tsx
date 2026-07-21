// ZenithUI atomic source snapshots adapted into @castalia/ui on 2026-07-20.

export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./components/Button.js";
export { Card, type CardProps, type CardVariant } from "./components/Card.js";
export {
  Badge,
  type BadgeProps,
  type BadgeVariant,
} from "./components/Badge.js";
export {
  Divider,
  type DividerProps,
  type DividerVariant,
} from "./components/Divider.js";
export {
  SectionLabel,
  type SectionLabelProps,
  type SectionLabelVariant,
} from "./components/SectionLabel.js";
export {
  StatusBadge,
  type StatusBadgeProps,
  type StatusBadgeTone,
} from "./components/StatusBadge.js";

// Legacy Status component retained for compatibility.
import type { PropsWithChildren } from "react";
export function Status({ children }: PropsWithChildren) {
  return <strong className="status">{children}</strong>;
}
