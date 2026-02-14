-- Fondazione Marea — Mock Data
-- Run this AFTER supabase-schema.sql

-- ============================================
-- SKILLS (if not already seeded)
-- ============================================
INSERT INTO skills (id, name, category, keywords) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'UX Design', 'Tech', 'ux, user experience, usabilità, esperienza utente'),
  ('a0000000-0000-0000-0000-000000000002', 'Web Development', 'Tech', 'web develop, sviluppat, developer, frontend, backend, full-stack, fullstack, software, programmator, informatica'),
  ('a0000000-0000-0000-0000-000000000003', 'Mobile Development', 'Tech', 'mobile, ios, android, app develop'),
  ('a0000000-0000-0000-0000-000000000004', 'Data Analysis', 'Tech', 'data analy, data scien, analisi dati, statistic, analytics, big data, machine learning'),
  ('a0000000-0000-0000-0000-000000000005', 'Project Management', 'Business', 'project manag, gestione progett, coordinat, program manager'),
  ('a0000000-0000-0000-0000-000000000006', 'Financial Planning', 'Business', 'finanz, financial, investment, banker, finance, contabil, economis, economia'),
  ('a0000000-0000-0000-0000-000000000007', 'Marketing', 'Business', 'marketing, commerciale, vendite, sales, growth, brand manager'),
  ('a0000000-0000-0000-0000-000000000008', 'Strategia', 'Business', 'strateg, ceo, founder, co-founder, direttore, direttrice, presidente, managing director, imprendit, chief'),
  ('a0000000-0000-0000-0000-000000000009', 'Comunicazione', 'Creative', 'comunicazion, communication, giornalis, stampa, relazioni pubbliche, public relation, social media'),
  ('a0000000-0000-0000-0000-000000000010', 'Graphic Design', 'Creative', 'graphic design, grafico, grafica, illustrat, art director, visual design'),
  ('a0000000-0000-0000-0000-000000000011', 'Copywriting', 'Creative', 'copywriter, copywriting, scrittore, scrittrice, redazion, editorial, content'),
  ('a0000000-0000-0000-0000-000000000012', 'Video Production', 'Creative', 'video, filmmaker, videomaker, regista, cinema, audiovisiv'),
  ('a0000000-0000-0000-0000-000000000013', 'Legal', 'Operations', 'legal, avvocat, legale, giuridic, diritto, notaio, lawyer, attorney, giurist'),
  ('a0000000-0000-0000-0000-000000000014', 'HR / Risorse Umane', 'Operations', 'risorse umane, human resource, recruiting, talent, personale'),
  ('a0000000-0000-0000-0000-000000000015', 'Fundraising', 'Operations', 'fundraising, raccolta fondi, grant, donazioni, filantropia'),
  ('a0000000-0000-0000-0000-000000000016', 'Consulenza', 'Business', 'consulen, consultant, consulting, advisor, policy, esperto, professore, professoressa, ricercat, università, accademi, docente'),
  ('a0000000-0000-0000-0000-000000000017', 'UI Design', 'Tech', 'ui, user interface, interfaccia')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PIONIERI
-- ============================================
INSERT INTO pionieri (id, full_name, email, location, bio, availability) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Marco Ferrara', 'marco.ferrara@gmail.com', 'San Francisco, CA',
   'Senior product designer con 12 anni di esperienza in startup tech della Silicon Valley. Originario di Catania.',
   '5 ore/mese'),
  ('b0000000-0000-0000-0000-000000000002', 'Giulia Amato', 'giulia.amato@outlook.com', 'Londra, UK',
   'Avvocata specializzata in diritto commerciale internazionale. Nata a Palermo, vive a Londra dal 2015.',
   '3 ore/mese'),
  ('b0000000-0000-0000-0000-000000000003', 'Alessandro Puglisi', 'a.puglisi@proton.me', 'Berlino, DE',
   'Full-stack developer e CTO di una startup fintech. Cresciuto a Siracusa.',
   '8 ore/mese'),
  ('b0000000-0000-0000-0000-000000000004', 'Francesca Lombardo', 'f.lombardo@gmail.com', 'Milano, IT',
   'Direttrice marketing in una grande azienda di moda. Nata a Trapani.',
   'Weekend'),
  ('b0000000-0000-0000-0000-000000000005', 'Roberto Cascio', 'r.cascio@yahoo.com', 'New York, NY',
   'Investment banker con passione per il sociale. Originario di Agrigento.',
   '4 ore/mese'),
  ('b0000000-0000-0000-0000-000000000006', 'Elena Ferrante', 'elena.f@gmail.com', 'Palermo, IT',
   'Videomaker e fotografa documentarista. Racconta storie di resilienza siciliana.',
   '10 ore/mese'),
  ('b0000000-0000-0000-0000-000000000007', 'Davide Messina', 'davide.messina@gmail.com', 'Toronto, CA',
   'Data scientist in una big tech. Appassionato di open data per il bene comune. Da Messina.',
   '6 ore/mese'),
  ('b0000000-0000-0000-0000-000000000008', 'Chiara Ferraro', 'chiara.ferraro@pm.me', 'Amsterdam, NL',
   'HR manager con esperienza in organizzazioni no-profit internazionali. Nata a Ragusa.',
   '4 ore/mese'),
  ('b0000000-0000-0000-0000-000000000009', 'Luca Battaglia', 'luca.b@outlook.com', 'Princeton, NJ',
   'Professore di economia allo sviluppo. Ricercatore su modelli di impatto sociale.',
   '3 ore/mese'),
  ('b0000000-0000-0000-0000-000000000010', 'Valentina Greco', 'v.greco@gmail.com', 'Catania, IT',
   'Graphic designer freelance e illustratrice. Lavora con ONG e fondazioni.',
   '8 ore/mese');

-- ============================================
-- PIONIERE SKILLS
-- ============================================
INSERT INTO pioniere_skills (pioniere_id, skill_id) VALUES
  -- Marco: UX Design, UI Design, Project Management
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000017'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005'),
  -- Giulia: Legal, Consulenza
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000013'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000016'),
  -- Alessandro: Web Development, Mobile Development, Data Analysis
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004'),
  -- Francesca: Marketing, Comunicazione, Strategia
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000007'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000009'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000008'),
  -- Roberto: Financial Planning, Fundraising, Consulenza
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000015'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000016'),
  -- Elena: Video Production, Comunicazione
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000012'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000009'),
  -- Davide: Data Analysis, Web Development, Project Management
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000005'),
  -- Chiara: HR, Project Management
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000014'),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000005'),
  -- Luca: Consulenza, Financial Planning, Strategia
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000016'),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000006'),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000008'),
  -- Valentina: Graphic Design, UI Design, Copywriting
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010'),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000017'),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000011');

-- ============================================
-- PROJECTS
-- ============================================
INSERT INTO projects (id, name, description, type, status) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'SiciliaVerde',
   'Piattaforma digitale per connettere agricoltori biologici siciliani con mercati europei. Necessita di sviluppo web e branding.',
   'onda_project', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'Bottega Digitale',
   'Progetto di digitalizzazione per artigiani tradizionali siciliani. E-commerce e formazione digitale.',
   'onda_project', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'MareNostrum Education',
   'Programma di mentoring per studenti universitari siciliani con professionisti della diaspora.',
   'onda_project', 'active'),
  ('c0000000-0000-0000-0000-000000000004', 'Rebranding Fondazione',
   'Aggiornamento dell''identità visiva e della strategia di comunicazione della fondazione.',
   'foundation_need', 'active'),
  ('c0000000-0000-0000-0000-000000000005', 'Report Impatto 2025',
   'Analisi dati e redazione del report annuale di impatto sociale della fondazione.',
   'foundation_need', 'active'),
  ('c0000000-0000-0000-0000-000000000006', 'Festa della Diaspora 2024',
   'Evento annuale di networking per la comunità dei Pionieri. Edizione completata con successo.',
   'foundation_need', 'completed');

-- ============================================
-- PROJECT NEEDS
-- ============================================
INSERT INTO project_needs (id, project_id, skill_id, description, hours_needed, urgency, status) VALUES
  -- SiciliaVerde
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
   'Sviluppo frontend della piattaforma marketplace', 40, 'high', 'open'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Design UX del flusso di acquisto', 15, 'high', 'open'),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007',
   'Piano marketing per il lancio', 20, 'medium', 'open'),
  -- Bottega Digitale
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
   'Setup piattaforma e-commerce Shopify', 25, 'medium', 'open'),
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000012',
   'Video promozionali per artigiani', 30, 'low', 'open'),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000010',
   'Branding e identità visiva per il progetto', 10, 'medium', 'open'),
  -- MareNostrum Education
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005',
   'Coordinamento programma mentoring', 15, 'high', 'matched'),
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000009',
   'Comunicazione e promozione nelle università', 10, 'medium', 'open'),
  -- Rebranding Fondazione
  ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000010',
   'Nuovo logo e materiali grafici', 20, 'high', 'matched'),
  ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000011',
   'Testi per sito web e brochure', 12, 'medium', 'open'),
  -- Report Impatto 2025
  ('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004',
   'Analisi dati di impatto e visualizzazioni', 20, 'high', 'open'),
  ('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000011',
   'Redazione testi del report', 15, 'medium', 'open'),
  -- Festa della Diaspora (completed)
  ('d0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000005',
   'Organizzazione e logistica evento', 30, 'high', 'fulfilled');

-- ============================================
-- MATCHES
-- ============================================
INSERT INTO matches (id, pioniere_id, project_need_id, status, notes, created_at) VALUES
  -- Chiara → MareNostrum (coordinamento) - active
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000007',
   'active', 'Chiara ha esperienza di mentoring da precedenti ruoli HR.', now() - interval '30 days'),
  -- Valentina → Rebranding Fondazione (grafica) - active
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000009',
   'active', 'Valentina ha già lavorato con la fondazione in passato.', now() - interval '20 days'),
  -- Chiara → Festa Diaspora (completed)
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000013',
   'completed', 'Organizzazione impeccabile!', now() - interval '90 days'),
  -- Alessandro → SiciliaVerde (proposed, new)
  ('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001',
   'proposed', 'Alessandro ha offerto supporto per il frontend React.', now() - interval '3 days'),
  -- Francesca → SiciliaVerde marketing (confirmed)
  ('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003',
   'confirmed', 'Disponibile da marzo.', now() - interval '7 days');

-- ============================================
-- TIME ENTRIES
-- ============================================
INSERT INTO time_entries (match_id, hours, date, description, created_at) VALUES
  -- Chiara on MareNostrum
  ('e0000000-0000-0000-0000-000000000001', 3, '2025-12-15', 'Setup struttura programma e criteri di selezione mentori', now() - interval '28 days'),
  ('e0000000-0000-0000-0000-000000000001', 2, '2025-12-22', 'Colloqui con 5 studenti candidati', now() - interval '21 days'),
  ('e0000000-0000-0000-0000-000000000001', 4, '2026-01-10', 'Sessione di onboarding mentori e matching studenti', now() - interval '14 days'),
  ('e0000000-0000-0000-0000-000000000001', 2, '2026-01-25', 'Follow-up con mentori e studenti, risoluzione problemi', now() - interval '5 days'),
  -- Valentina on Rebranding
  ('e0000000-0000-0000-0000-000000000002', 4, '2026-01-05', 'Ricerca visiva e moodboard per nuovo branding', now() - interval '18 days'),
  ('e0000000-0000-0000-0000-000000000002', 6, '2026-01-12', 'Prima proposta logo e palette colori', now() - interval '15 days'),
  ('e0000000-0000-0000-0000-000000000002', 3, '2026-01-20', 'Revisioni dopo feedback del team fondazione', now() - interval '10 days'),
  ('e0000000-0000-0000-0000-000000000002', 5, '2026-02-01', 'Design materiali collaterali (biglietti, carta intestata)', now() - interval '5 days'),
  -- Chiara on Festa Diaspora (completed)
  ('e0000000-0000-0000-0000-000000000003', 8, '2024-10-01', 'Pianificazione evento e contatti con fornitori', now() - interval '100 days'),
  ('e0000000-0000-0000-0000-000000000003', 10, '2024-10-15', 'Coordinamento logistica e programma', now() - interval '95 days'),
  ('e0000000-0000-0000-0000-000000000003', 12, '2024-11-01', 'Gestione evento e post-evento', now() - interval '85 days');
