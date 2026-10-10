-- position is the order inside a generation (1-based). dex is null for
-- entries added by hand.
CREATE TABLE entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dex INTEGER,
  name TEXT NOT NULL,
  gen INTEGER NOT NULL,
  position INTEGER NOT NULL,
  owned INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX entries_gen_position ON entries (gen, position);
