import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "./Button";
import { cx } from "./cx";

type Props = {
  className?: string;
  children: ReactNode;
  /** Primary CTA to `/book`; omit to hide. */
  bookHref?: string;
  bookLabel?: string;
  actions?: ReactNode;
};

export function EmptyState({
  className,
  children,
  bookHref = "/book",
  bookLabel = "Ke kalender booking",
  actions,
}: Props) {
  const showBook = bookHref != null && bookHref.length > 0;
  return (
    <div className={cx("empty-state", className)}>
      {children}
      {(actions || showBook) && (
        <div className="empty-state-actions">
          {actions}
          {showBook ? (
            <Link href={bookHref} className={buttonClass({ variant: "primary" })}>
              {bookLabel}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
