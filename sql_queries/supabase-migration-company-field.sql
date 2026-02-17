-- Add company field to pionieri table
ALTER TABLE pionieri ADD COLUMN IF NOT EXISTS company text;
