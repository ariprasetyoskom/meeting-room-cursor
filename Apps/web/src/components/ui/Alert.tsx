import type { ReactNode } from "react";
import { cx } from "./cx";

export type AlertVariant = "error" | "success" | "warning" | "info";

type Props = {
  variant?: AlertVariant;
  title?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function Alert({ variant = "info", title, className, children }: Props) {
  // Errors interrupt screen readers; other variants are announced politely.
  const role = variant === "error" ? "alert" : "status";
  return (
    <div className={cx("alert", `alert-${variant}`, className)} role={role}>
      {title ? <p className="alert-title">{title}</p> : null}
      {children}
    </div>
  );
}
