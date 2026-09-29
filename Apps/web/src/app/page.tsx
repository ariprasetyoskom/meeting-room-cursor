import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Booking Ruang Meeting</h1>
      <p>MVP scaffold — Next.js + PostgreSQL + Redis (BullMQ).</p>
      <ul>
        <li>
          <Link href="/rooms">Daftar ruang</Link>
        </li>
        <li>
          <a href="/api/health">Health check</a>
        </li>
      </ul>
      <p style={{ marginTop: "2rem", color: "#555", maxWidth: 640 }}>
        Dev auth: set <code>AUTH_MODE=dev</code> dan{" "}
        <code>DEV_USER_ID</code> (dari <code>npm run db:seed</code>) atau kirim
        header <code>x-dev-user-id</code> ke <code>/api/v1/*</code>.
      </p>
    </main>
  );
}
