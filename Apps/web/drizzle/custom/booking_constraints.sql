-- PostgreSQL-only rules (not expressible in Drizzle schema)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap_confirmed;

ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap_confirmed
EXCLUDE USING gist (
  room_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (status = 'confirmed');

CREATE INDEX IF NOT EXISTS idx_bookings_room_start ON bookings (room_id, start_at) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_bookings_organizer ON bookings (organizer_user_id, start_at DESC);
