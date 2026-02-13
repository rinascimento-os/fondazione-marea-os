-- Fondazione Marea — Time Bank Database Schema
-- Run this in the Supabase SQL Editor to set up all tables

-- 1. Pionieri (volunteer network)
CREATE TABLE IF NOT EXISTS pionieri (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  location text,
  bio text,
  availability text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE pionieri ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON pionieri;
CREATE POLICY "Allow all for authenticated" ON pionieri FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Skills (competency taxonomy)
CREATE TABLE IF NOT EXISTS skills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON skills;
CREATE POLICY "Allow all for authenticated" ON skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Pioniere-Skills join table
CREATE TABLE IF NOT EXISTS pioniere_skills (
  pioniere_id uuid REFERENCES pionieri(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  proficiency text,
  PRIMARY KEY (pioniere_id, skill_id)
);
ALTER TABLE pioniere_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON pioniere_skills;
CREATE POLICY "Allow all for authenticated" ON pioniere_skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Projects (Onda projects + foundation needs)
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text CHECK (type IN ('onda_project', 'foundation_need')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON projects;
CREATE POLICY "Allow all for authenticated" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Project needs
CREATE TABLE IF NOT EXISTS project_needs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id),
  description text,
  hours_needed integer,
  urgency text DEFAULT 'medium' CHECK (urgency IN ('high', 'medium', 'low')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'matched', 'fulfilled')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE project_needs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON project_needs;
CREATE POLICY "Allow all for authenticated" ON project_needs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Matches (admin-created pairings)
CREATE TABLE IF NOT EXISTS matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pioniere_id uuid REFERENCES pionieri(id),
  project_need_id uuid REFERENCES project_needs(id),
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'active', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON matches;
CREATE POLICY "Allow all for authenticated" ON matches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Time entries (hours tracking ledger)
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES matches(id),
  hours decimal NOT NULL,
  date date NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON time_entries;
CREATE POLICY "Allow all for authenticated" ON time_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed some initial skill categories
INSERT INTO skills (name, category) VALUES
  ('UX Design', 'Tech'),
  ('UI Design', 'Tech'),
  ('Web Development', 'Tech'),
  ('Mobile Development', 'Tech'),
  ('Data Analysis', 'Tech'),
  ('Project Management', 'Business'),
  ('Financial Planning', 'Business'),
  ('Marketing', 'Business'),
  ('Strategia', 'Business'),
  ('Comunicazione', 'Creative'),
  ('Graphic Design', 'Creative'),
  ('Copywriting', 'Creative'),
  ('Video Production', 'Creative'),
  ('Legal', 'Operations'),
  ('HR / Risorse Umane', 'Operations'),
  ('Fundraising', 'Operations'),
  ('Consulenza', 'Business')
ON CONFLICT DO NOTHING;
