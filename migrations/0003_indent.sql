-- indent = show the entry indented under the one above it (regional forms).
ALTER TABLE entries ADD COLUMN indent INTEGER NOT NULL DEFAULT 0;

UPDATE entries SET indent = 1
WHERE name LIKE 'Alolan %' OR name LIKE 'Galarian %' OR name LIKE 'Hisuian %' OR name LIKE 'Paldean %';
