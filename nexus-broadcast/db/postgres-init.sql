CREATE TABLE IF NOT EXISTS nexus_platform_state (
  state_key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nexus_platform_state_updated_at_idx
  ON nexus_platform_state (updated_at DESC);
