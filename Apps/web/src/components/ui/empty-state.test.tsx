import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";
import { ListLoadError } from "./ListLoadError";

describe("EmptyState", () => {
  it("renders a primary CTA to /book by default", () => {
    const html = renderToStaticMarkup(
      <EmptyState>
        <p>Kosong</p>
      </EmptyState>,
    );
    expect(html).toContain('href="/book"');
    expect(html).toContain("Ke kalender booking");
  });

  it("allows custom book label and href", () => {
    const html = renderToStaticMarkup(
      <EmptyState bookHref="/book" bookLabel="Booking baru">
        <p>Kosong</p>
      </EmptyState>,
    );
    expect(html).toContain("Booking baru");
  });
});

describe("ListLoadError", () => {
  it("shows error alert, retry, and book CTA", () => {
    const html = renderToStaticMarkup(
      <ListLoadError message="Gagal memuat." onRetry={() => {}} bookLabel="Booking baru" />,
    );
    expect(html).toContain("alert-error");
    expect(html).toContain("Gagal memuat.");
    expect(html).toContain("Coba lagi");
    expect(html).toContain('href="/book"');
    expect(html).toContain("Booking baru");
  });
});
