type Props = {
  label?: string;
};

export function LoadingBlock({ label = "Memuat…" }: Props) {
  return (
    <p className="loading-block text-muted" role="status">
      {label}
    </p>
  );
}
