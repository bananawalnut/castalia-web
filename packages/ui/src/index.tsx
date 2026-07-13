import type { PropsWithChildren } from "react";
export function Status({ children }: PropsWithChildren) {
  return <strong className="status">{children}</strong>;
}
