import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type Props = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "li";
  title?: ReactNode;
  actions?: ReactNode;
  padding?: "md" | "lg";
};

export function Card({
  as: Tag = "div",
  title,
  actions,
  padding = "md",
  className,
  children,
  ...rest
}: Props) {
  return (
    <Tag className={cx("card", padding === "lg" && "card-lg", className)} {...rest}>
      {title || actions ? (
        <div className="card-header">
          {title ? <h2 className="card-title">{title}</h2> : null}
          {actions ? <div className="card-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}
