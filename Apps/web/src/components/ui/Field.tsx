import type { ReactNode } from "react";
import { cx } from "./cx";

type Props = {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Wraps a single control in its `<label>` so the association needs no ids. */
export function Field({ label, required, hint, className, children }: Props) {
  return (
    <label className={cx("field", className)}>
      <span className="field-label">
        {label}
        {required ? (
          <span className="field-required" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
