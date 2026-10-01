import { Alert } from "./Alert";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

type Props = {
  message: string;
  onRetry?: () => void;
  bookLabel?: string;
};

/** Load failure with optional retry and CTA to `/book` (UI-07). */
export function ListLoadError({ message, onRetry, bookLabel }: Props) {
  return (
    <EmptyState
      bookLabel={bookLabel ?? "Ke kalender booking"}
      actions={
        onRetry ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            Coba lagi
          </Button>
        ) : undefined
      }
    >
      <Alert variant="error">{message}</Alert>
    </EmptyState>
  );
}
