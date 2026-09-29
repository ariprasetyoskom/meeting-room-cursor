ALTER TABLE users ADD COLUMN IF NOT EXISTS external_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_external_sub_unique ON users (external_sub) WHERE external_sub IS NOT NULL;
