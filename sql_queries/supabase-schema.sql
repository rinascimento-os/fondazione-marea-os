-- Fondazione Marea — Time Bank Database Schema
-- Run this in the Supabase SQL Editor to set up all tables

-- 1. Pionieri (volunteer network)
CREATE TABLE IF NOT EXISTS pionieri (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  company text,
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
  category text,
  keywords text  -- comma-separated keywords for CSV import matching
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

-- Seed skill taxonomy v2 (46 skills) — see supabase-migration-skills-v2.sql for full details
INSERT INTO skills (name, category, keywords) VALUES
  -- Strategia & Leadership
  ('Strategia Aziendale', 'Strategia & Leadership', 'strateg, business model, revenue model, piano industrial, modello di business, business plan, corporate develop, chief strategy, sviluppo strategico, pianificazione strategica, strategy, head of innovation, innovation lead'),
  ('Imprenditorialità & Startup', 'Strategia & Leadership', 'founder, fondator, fondatrice, co-founder, cofoundat, imprendit, startup, ceo, chief executive officer, titolare, proprietario, owner, ditta individuale, amministrator, legale rappresentante, socio fondatore, socio unico, socio amministrator'),
  ('Leadership & Governance', 'Strategia & Leadership', 'presidente, direttore, direttrice, dirigent, board member, membro cda, managing director, vice president, vp, prorettore, segretario general, consiglier, chairman, general manager, country representative, managing partner, equity partner, senior director, director, cdbo, consiglio direttivo, capo programma, responsabile d'),
  ('Innovazione Sociale & Terzo Settore', 'Strategia & Leadership', 'impresa sociale, cooperativa sociale, cooperativa, terzo settore, non profit, nonprofit, no profit, società benefit, impatto sociale, social enterprise, social innovation, social impact, ets, aps, onlus'),
  -- Business & Mercato
  ('Business Development', 'Business & Mercato', 'business develop, growth, go-to-market, sviluppo commerciale, business developer, new business, espansione, sviluppo business, partnership develop, market development'),
  ('Sales & Key Account', 'Business & Mercato', 'sales, vendite, account manager, account executive, key account, commerciale, direttore commerciale, responsabile commerciale, head of sales, sales manager, sales executive, responsabile vendite, territorial manager, senior account'),
  ('Marketing Digitale', 'Business & Mercato', 'marketing, digital market, performance market, seo, sem, growth hack, advertising, cmo, chief marketing, head of marketing, responsabile marketing, campaign, inbound, lead generation'),
  ('Branding & Storytelling', 'Business & Mercato', 'brand, branding, storytelling, brand identity, brand manager, creative director, direttore creativo, narrazione, corporate identity, identità visiva'),
  ('Analisi di Mercato', 'Business & Mercato', 'analisi di mercato, market research, market analy, competitor, benchmarking, ricerca di mercato, analisi target, profilazione, market intelligence'),
  -- Comunicazione & Media
  ('Relazioni Pubbliche & Comunicazione', 'Comunicazione & Media', 'comunicazion, communication, relazioni pubbliche, public relation, media relation, press, ufficio stampa, corporate communication, head of communication, responsabile comunicazione, portavoce'),
  ('Social Media Management', 'Comunicazione & Media', 'social media, content creator, social network, social media manager, social media strategist, content manager, content marketing, influencer'),
  ('Giornalismo & Editoria', 'Comunicazione & Media', 'giornalis, journalist, editor, editoria, redazion, stampa, scrittore, scrittrice, direttore responsabile, reporter, publisher, editor in chief, magazine, rivista, cronista, piano editoriale'),
  -- Finanza
  ('Finanza & Investimenti', 'Finanza', 'finanz, financial, investment, investor, venture capital, private equity, asset manage, portfolio, chief investment, investiment, angel investor, business angel, sgr, venture, m&a, merger, acquisition, fondi, capital market'),
  ('Fundraising & Crowdfunding', 'Finanza', 'fundraising, raccolta fondi, crowdfunding, donazion, bando, bandi, grant, campagna raccolta, filantropia, donor'),
  ('Contabilità & Controllo Gestione', 'Finanza', 'contabil, commercialista, revisore, controllo di gestione, bilancio, fiscale, tributar, ragionier, cfo, chief financial, fractional cfo, financial controller, gestione crediti, accounting'),
  ('Banking & Servizi Finanziari', 'Finanza', 'banca, bank, credit risk, lending, risparmio, wealth manage, finanziaria, fintech, assicurazion, insurance, credito'),
  -- Legale
  ('Diritto Societario & Commerciale', 'Legale', 'avvocat, lawyer, legale, diritto, notaio, studio legale, attorney, giurist, legal, associate lawyer, senior lawyer, trainee lawyer, counsel, senior associate'),
  ('Diritto Internazionale & Regolamentazione', 'Legale', 'diritto internazionale, international law, diritto europeo, regulatory, compliance, regolament, data protection, gdpr, normativ, eu law, european law, conduct risk'),
  ('Proprietà Intellettuale', 'Legale', 'proprietà intellettuale, intellectual property, brevett, patent, marchi, trademark, design attorney, copyright'),
  -- Tecnologia
  ('Software Engineering', 'Tecnologia', 'software, developer, sviluppat, programmat, engineering lead, full-stack, fullstack, frontend, backend, web develop, mobile develop, app develop, cto, chief technology, chief software, devops, saas, coding, coder, ict, it manager, director of engineering, software engineer, solution architect, cio, chief information'),
  ('Data Science & AI', 'Tecnologia', 'data scien, machine learning, intelligenza artificiale, artificial intelligence, algorithm, deep learning, analytics, data analy, big data, deepmind, deep mind, neural, research scientist, computer vision, nlp, product data analyst'),
  ('Product & UX Design', 'Tecnologia', 'product design, ux design, user experience, ui design, user interface, usabilità, product manager, service design, experience design, interaction design, product designer, accessib'),
  ('Cybersecurity & Data Protection', 'Tecnologia', 'cybersecurity, cyber security, sicurezza informatica, information security, infosec, data protection officer, cyber, security analyst'),
  -- Organizzazione
  ('Project Management', 'Organizzazione', 'project manag, gestione progett, program manager, project leader, project director, pmo, rendicontazione, pianificazione, capo progetto, coordinat, transformation project'),
  ('Operations & Logistica', 'Organizzazione', 'operations, operativ, logistic, supply chain, coo, chief operating, direttore operativo, head of operations, operations manager, gestione operativa, facility, customer experience'),
  ('Risorse Umane & Talent', 'Organizzazione', 'risorse umane, human resource, recruiting, talent, hr manager, people & culture, career coach, leadership development, talent manager, head of people, welfare, employer branding, personale'),
  ('Event Management', 'Organizzazione', 'event, eventi, organizzazione eventi, fiera, conferenza, convegno, congress, venue, cultural manager, spettacol, festival'),
  -- Consulenza
  ('Management Consulting', 'Consulenza', 'consulen, consultant, consulting, advisory, advisor, esperto, expert, freelance, freelancer, libero professionista, fractional, senior manager, manager, partner, socio'),
  ('Export & Internazionalizzazione', 'Consulenza', 'export, internazional, international trade, commercio estero, mercati esteri, cross-border, import-export, global market, international business'),
  -- Design & Creatività
  ('Design & Architettura', 'Design & Creatività', 'design, architett, grafico, grafica, graphic, art director, visual, illustrat, interior design, progettazione, designer, architettura, urbanis'),
  ('Produzione Video & Fotografia', 'Design & Creatività', 'video, film, videomaker, regista, cinema, audiovisiv, fotograf, photo, produzione video, filmmaker, documentar, visual content'),
  -- Impatto & Fondazione
  ('Filantropia & Donor Relations', 'Impatto & Fondazione', 'filantropia, philanthropy, donor, donator, giving, charity, beneficenza, mecenatismo, major gift, fondazione'),
  ('Sostenibilità & ESG', 'Impatto & Fondazione', 'esg, sostenibil, sustainability, csr, corporate social, b corp, sviluppo sostenibile, economia circolare, circular economy, impatto ambientale, responsible, environmental, circular'),
  ('Community Building & Reti', 'Impatto & Fondazione', 'community, rete, network, partnership, associazion, facilitator, facilitatrice, community building, stakeholder, membership, aggreg'),
  -- Formazione & Ricerca
  ('Accademia & Ricerca', 'Formazione & Ricerca', 'professore, professoressa, ricercat, universit, accademi, docente, cattedra, dipartimento, ateneo, scholar, ordinario, tenure, laboratorio, academy'),
  ('Formazione & Educazione', 'Formazione & Ricerca', 'formazione, educazione, education, didattica, capacity building, mentoring, coaching, training, insegnante, scuola, teach, tutor, learning, scolastic'),
  -- Policy & Istituzioni
  ('Relazioni Istituzionali & Policy', 'Policy & Istituzioni', 'policy, istituzional, government relation, public affairs, pubblica amministrazione, commissione europea, parlamento, ministero, console, affari esteri, commissioner, funzionario, consigliere comunale'),
  ('Cooperazione Internazionale', 'Policy & Istituzioni', 'cooperazione internazionale, international cooperation, international development, ong, ngo, humanitarian, resettlement, nazioni unite, united nations, defence, nato, development cooperation, peacebuilding'),
  -- Settoriali
  ('Food & Agricoltura', 'Settoriale', 'agricol, agronom, agrifood, agri-food, food, alimentar, azienda agricola, vino, wine, olio, dolceria, pasticceria, gastronom, caffè, caffé, ristoran, chef, enogastronom, biologico, filiera'),
  ('Turismo & Hospitality', 'Settoriale', 'turismo, tourism, hospitality, hotel, albergo, travel, ricettiv, accoglienza, booking, tour operator, wonderful italy, destination, b&b'),
  ('Sanità & Pharma', 'Settoriale', 'medic, sanità, health, pharma, farmac, ospedale, clinical, biotech, biomedi, oncolog, immunolog, physician, medical device, regulatory affairs, diagnostica, terapeutic, sanitari'),
  ('Energia & Ambiente', 'Settoriale', 'energ, ambiente, environmental, transizione energetica, rinnovabil, renewable, clima, climate, green, carbon, bio fuel, cleantech, fotovoltaic, eolico, power, elettric'),
  ('Real Estate & Rigenerazione Urbana', 'Settoriale', 'real estate, immobiliar, rigenerazione urbana, urban, edili, costruzion, property, urban design, urban regeneration, edilizia, cantiere, ingegneria civile'),
  ('Manifattura & Ingegneria', 'Settoriale', 'ingegner, manifattur, produzione industriale, industriale, manufacturing, fabbrica, quality assurance, production engineer, meccanica, meccanico, impianti, technical manager, direttore tecnico, rov, ingegneria'),
  ('Moda, Lusso & Retail', 'Settoriale', 'moda, fashion, lusso, luxury, retail, abbigliamento, tessile, boutique, vintage, e-commerce, ecommerce'),
  ('Grant Making & Progettazione Europea', 'Settoriale', 'grant making, progettazione europea, eu funding, fondi europei, europrogettazione, bandi europei, horizon, interreg, finanziamenti europei')
ON CONFLICT DO NOTHING;
