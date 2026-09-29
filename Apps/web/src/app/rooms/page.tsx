import Link from "next/link";

async function fetchRooms() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const devUserId = process.env.DEV_USER_ID;
  if (!devUserId) {
    return null;
  }
  const res = await fetch(`${base}/api/v1/rooms`, {
    headers: { "x-dev-user-id": devUserId },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    rooms: Array<{
      id: string;
      name: string;
      floor: string | null;
      capacity: number;
    }>;
  };
  return data.rooms;
}

export default async function RoomsPage() {
  const rooms = await fetchRooms();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <p>
        <Link href="/">← Home</Link>
      </p>
      <h1>Ruang Meeting</h1>
      {!rooms && (
        <p>
          Set <code>DEV_USER_ID</code> di <code>.env.local</code> lalu jalankan{" "}
          <code>npm run db:seed</code>.
        </p>
      )}
      {rooms && (
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>
              {room.name} — lantai {room.floor ?? "-"}, kapasitas {room.capacity}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
