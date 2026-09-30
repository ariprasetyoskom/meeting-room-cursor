import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-outline"
  | "link";

export type ButtonSize = "sm" | "md";

type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/** Same classes as `<Button>`, for `<Link>` or `<a>` styled as buttons. */
export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: ButtonClassOptions = {}): string {
  if (variant === "link") return cx("btn-link", className);
  return cx("btn", `btn-${variant}`, size === "sm" && "btn-sm", className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonClassOptions & {
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant, size, className, loading = false, disabled, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClass({ variant, size, className })}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      />
    );
  },
);
