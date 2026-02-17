-- Fondazione Marea — Fresh Start Migration
-- Clears ALL mock data, sets up skill taxonomy v2, and seeds Onda projects + needs
-- Run this as a single transaction on Supabase SQL Editor
--
-- Prerequisites: run supabase-migration-company-field.sql first (adds company column)

BEGIN;

-- ═══════════════════════════════════════════
-- 1. CLEAR ALL EXISTING DATA (respecting FK order)
-- ═══════════════════════════════════════════
DELETE FROM time_entries;
DELETE FROM matches;
DELETE FROM project_needs;
DELETE FROM pioniere_skills;
DELETE FROM projects;
DELETE FROM pionieri;
DELETE FROM skills;

-- ═══════════════════════════════════════════
-- 2. INSERT SKILL TAXONOMY (46 skills)
-- ═══════════════════════════════════════════

INSERT INTO skills (name, category, keywords) VALUES

-- Strategia & Leadership
('Strategia Aziendale', 'Strategia & Leadership',
 'strateg, business model, revenue model, piano industrial, modello di business, business plan, corporate develop, chief strategy, sviluppo strategico, pianificazione strategica, strategy, head of innovation, innovation lead'),

('Imprenditorialità & Startup', 'Strategia & Leadership',
 'founder, fondator, fondatrice, co-founder, cofoundat, imprendit, startup, ceo, chief executive officer, titolare, proprietario, owner, ditta individuale, amministrator, legale rappresentante, socio fondatore, socio unico, socio amministrator'),

('Leadership & Governance', 'Strategia & Leadership',
 'presidente, direttore, direttrice, dirigent, board member, membro cda, managing director, vice president, vp, prorettore, segretario general, consiglier, chairman, general manager, country representative, managing partner, equity partner, senior director, director, cdbo, consiglio direttivo, capo programma, responsabile d'),

('Innovazione Sociale & Terzo Settore', 'Strategia & Leadership',
 'impresa sociale, cooperativa sociale, cooperativa, terzo settore, non profit, nonprofit, no profit, società benefit, impatto sociale, social enterprise, social innovation, social impact, ets, aps, onlus'),

-- Business & Mercato
('Business Development', 'Business & Mercato',
 'business develop, growth, go-to-market, sviluppo commerciale, business developer, new business, espansione, sviluppo business, partnership develop, market development'),

('Sales & Key Account', 'Business & Mercato',
 'sales, vendite, account manager, account executive, key account, commerciale, direttore commerciale, responsabile commerciale, head of sales, sales manager, sales executive, responsabile vendite, territorial manager, senior account'),

('Marketing Digitale', 'Business & Mercato',
 'marketing, digital market, performance market, seo, sem, growth hack, advertising, cmo, chief marketing, head of marketing, responsabile marketing, campaign, inbound, lead generation'),

('Branding & Storytelling', 'Business & Mercato',
 'brand, branding, storytelling, brand identity, brand manager, creative director, direttore creativo, narrazione, corporate identity, identità visiva'),

('Analisi di Mercato', 'Business & Mercato',
 'analisi di mercato, market research, market analy, competitor, benchmarking, ricerca di mercato, analisi target, profilazione, market intelligence'),

-- Comunicazione & Media
('Relazioni Pubbliche & Comunicazione', 'Comunicazione & Media',
 'comunicazion, communication, relazioni pubbliche, public relation, media relation, press, ufficio stampa, corporate communication, head of communication, responsabile comunicazione, portavoce'),

('Social Media Management', 'Comunicazione & Media',
 'social media, content creator, social network, social media manager, social media strategist, content manager, content marketing, influencer'),

('Giornalismo & Editoria', 'Comunicazione & Media',
 'giornalis, journalist, editor, editoria, redazion, stampa, scrittore, scrittrice, direttore responsabile, reporter, publisher, editor in chief, magazine, rivista, cronista, piano editoriale'),

-- Finanza
('Finanza & Investimenti', 'Finanza',
 'finanz, financial, investment, investor, venture capital, private equity, asset manage, portfolio, chief investment, investiment, angel investor, business angel, sgr, venture, m&a, merger, acquisition, fondi, capital market'),

('Fundraising & Crowdfunding', 'Finanza',
 'fundraising, raccolta fondi, crowdfunding, donazion, bando, bandi, grant, campagna raccolta, filantropia, donor'),

('Contabilità & Controllo Gestione', 'Finanza',
 'contabil, commercialista, revisore, controllo di gestione, bilancio, fiscale, tributar, ragionier, cfo, chief financial, fractional cfo, financial controller, gestione crediti, accounting'),

('Banking & Servizi Finanziari', 'Finanza',
 'banca, bank, credit risk, lending, risparmio, wealth manage, finanziaria, fintech, assicurazion, insurance, credito'),

-- Legale
('Diritto Societario & Commerciale', 'Legale',
 'avvocat, lawyer, legale, diritto, notaio, studio legale, attorney, giurist, legal, associate lawyer, senior lawyer, trainee lawyer, counsel, senior associate'),

('Diritto Internazionale & Regolamentazione', 'Legale',
 'diritto internazionale, international law, diritto europeo, regulatory, compliance, regolament, data protection, gdpr, normativ, eu law, european law, conduct risk'),

('Proprietà Intellettuale', 'Legale',
 'proprietà intellettuale, intellectual property, brevett, patent, marchi, trademark, design attorney, copyright'),

-- Tecnologia
('Software Engineering', 'Tecnologia',
 'software, developer, sviluppat, programmat, engineering lead, full-stack, fullstack, frontend, backend, web develop, mobile develop, app develop, cto, chief technology, chief software, devops, saas, coding, coder, ict, it manager, director of engineering, software engineer, solution architect, cio, chief information'),

('Data Science & AI', 'Tecnologia',
 'data scien, machine learning, intelligenza artificiale, artificial intelligence, algorithm, deep learning, analytics, data analy, big data, deepmind, deep mind, neural, research scientist, computer vision, nlp, product data analyst'),

('Product & UX Design', 'Tecnologia',
 'product design, ux design, user experience, ui design, user interface, usabilità, product manager, service design, experience design, interaction design, product designer, accessib'),

('Cybersecurity & Data Protection', 'Tecnologia',
 'cybersecurity, cyber security, sicurezza informatica, information security, infosec, data protection officer, cyber, security analyst'),

-- Organizzazione
('Project Management', 'Organizzazione',
 'project manag, gestione progett, program manager, project leader, project director, pmo, rendicontazione, pianificazione, capo progetto, coordinat, transformation project'),

('Operations & Logistica', 'Organizzazione',
 'operations, operativ, logistic, supply chain, coo, chief operating, direttore operativo, head of operations, operations manager, gestione operativa, facility, customer experience'),

('Risorse Umane & Talent', 'Organizzazione',
 'risorse umane, human resource, recruiting, talent, hr manager, people & culture, career coach, leadership development, talent manager, head of people, welfare, employer branding, personale'),

('Event Management', 'Organizzazione',
 'event, eventi, organizzazione eventi, fiera, conferenza, convegno, congress, venue, cultural manager, spettacol, festival'),

-- Consulenza
('Management Consulting', 'Consulenza',
 'consulen, consultant, consulting, advisory, advisor, esperto, expert, freelance, freelancer, libero professionista, fractional, senior manager, manager, partner, socio'),

('Export & Internazionalizzazione', 'Consulenza',
 'export, internazional, international trade, commercio estero, mercati esteri, cross-border, import-export, global market, international business'),

-- Design & Creatività
('Design & Architettura', 'Design & Creatività',
 'design, architett, grafico, grafica, graphic, art director, visual, illustrat, interior design, progettazione, designer, architettura, urbanis'),

('Produzione Video & Fotografia', 'Design & Creatività',
 'video, film, videomaker, regista, cinema, audiovisiv, fotograf, photo, produzione video, filmmaker, documentar, visual content'),

-- Impatto & Fondazione
('Filantropia & Donor Relations', 'Impatto & Fondazione',
 'filantropia, philanthropy, donor, donator, giving, charity, beneficenza, mecenatismo, major gift, fondazione'),

('Sostenibilità & ESG', 'Impatto & Fondazione',
 'esg, sostenibil, sustainability, csr, corporate social, b corp, sviluppo sostenibile, economia circolare, circular economy, impatto ambientale, responsible, environmental, circular'),

('Community Building & Reti', 'Impatto & Fondazione',
 'community, rete, network, partnership, associazion, facilitator, facilitatrice, community building, stakeholder, membership, aggreg'),

-- Formazione & Ricerca
('Accademia & Ricerca', 'Formazione & Ricerca',
 'professore, professoressa, ricercat, universit, accademi, docente, cattedra, dipartimento, ateneo, scholar, ordinario, tenure, laboratorio, academy'),

('Formazione & Educazione', 'Formazione & Ricerca',
 'formazione, educazione, education, didattica, capacity building, mentoring, coaching, training, insegnante, scuola, teach, tutor, learning, scolastic'),

-- Policy & Istituzioni
('Relazioni Istituzionali & Policy', 'Policy & Istituzioni',
 'policy, istituzional, government relation, public affairs, pubblica amministrazione, commissione europea, parlamento, ministero, console, affari esteri, commissioner, funzionario, consigliere comunale'),

('Cooperazione Internazionale', 'Policy & Istituzioni',
 'cooperazione internazionale, international cooperation, international development, ong, ngo, humanitarian, resettlement, nazioni unite, united nations, defence, nato, development cooperation, peacebuilding'),

-- Settoriali
('Food & Agricoltura', 'Settoriale',
 'agricol, agronom, agrifood, agri-food, food, alimentar, azienda agricola, vino, wine, olio, dolceria, pasticceria, gastronom, caffè, caffé, ristoran, chef, enogastronom, biologico, filiera'),

('Turismo & Hospitality', 'Settoriale',
 'turismo, tourism, hospitality, hotel, albergo, travel, ricettiv, accoglienza, booking, tour operator, wonderful italy, destination, b&b'),

('Sanità & Pharma', 'Settoriale',
 'medic, sanità, health, pharma, farmac, ospedale, clinical, biotech, biomedi, oncolog, immunolog, physician, medical device, regulatory affairs, diagnostica, terapeutic, sanitari'),

('Energia & Ambiente', 'Settoriale',
 'energ, ambiente, environmental, transizione energetica, rinnovabil, renewable, clima, climate, green, carbon, bio fuel, cleantech, fotovoltaic, eolico, power, elettric'),

('Real Estate & Rigenerazione Urbana', 'Settoriale',
 'real estate, immobiliar, rigenerazione urbana, urban, edili, costruzion, property, urban design, urban regeneration, edilizia, cantiere, ingegneria civile'),

('Manifattura & Ingegneria', 'Settoriale',
 'ingegner, manifattur, produzione industriale, industriale, manufacturing, fabbrica, quality assurance, production engineer, meccanica, meccanico, impianti, technical manager, direttore tecnico, rov, ingegneria'),

('Moda, Lusso & Retail', 'Settoriale',
 'moda, fashion, lusso, luxury, retail, abbigliamento, tessile, boutique, vintage, e-commerce, ecommerce'),

('Grant Making & Progettazione Europea', 'Settoriale',
 'grant making, progettazione europea, eu funding, fondi europei, europrogettazione, bandi europei, horizon, interreg, finanziamenti europei');


-- ═══════════════════════════════════════════
-- 3. INSERT ONDA PROJECTS
-- ═══════════════════════════════════════════

INSERT INTO projects (name, description, type, status) VALUES
('Agorà', 'Startup Onda — Tutor: Francesco Nox', 'onda_project', 'active'),
('O.P.E.N.', 'Startup Onda — Tutor: Silveria Mobilio Rodriguez', 'onda_project', 'active'),
('Nexo Sicilia', 'Startup Onda — Tutor: Alberto Muscari Tomaglioli', 'onda_project', 'active'),
('Scuola Dinamica', 'Startup Onda — Tutor: Francesco Nox', 'onda_project', 'active'),
('Zagara', 'Startup Onda — Tutor: Ilaria Pais', 'onda_project', 'active'),
('Buscemi Rural Hub', 'Startup Onda — Tutor: Alberto Muscari Tomaglioli', 'onda_project', 'active'),
('L''orto di Pino', 'Startup Onda — Tutor: Leonardo Daniele', 'onda_project', 'active'),
('Progetto Spora', 'Startup Onda — Tutor: Leonardo Daniele', 'onda_project', 'active'),
('La casa delle lavoratrici Angela Rizzo', 'Startup Onda — Tutor: Leonardo Daniele', 'onda_project', 'active'),
('MAQALUBA', 'Startup Onda — Tutor: Silveria Mobilio Rodriguez', 'onda_project', 'active'),
('UNNA', 'Startup Onda — Tutor: Anas Anjrini', 'onda_project', 'active'),
('Polaris', 'Startup Onda — Tutor: Alessandro Melioli', 'onda_project', 'active'),
('Fuori centro', 'Startup Onda — Tutor: Francesco Nox', 'onda_project', 'active');


-- ═══════════════════════════════════════════
-- 4. INSERT PROJECT NEEDS (mapped to skills)
-- ═══════════════════════════════════════════

-- Agorà
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'Agorà'),
 (SELECT id FROM skills WHERE name = 'Software Engineering'),
 'Hanno bisogno di un tecnico',
 'high');

-- O.P.E.N.
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'O.P.E.N.'),
 (SELECT id FROM skills WHERE name = 'Real Estate & Rigenerazione Urbana'),
 'Ricerca spazio in comodato gratuito, va bene anche nelle periferie di Palermo ma ben collegato',
 'high');

-- Nexo Sicilia
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'Nexo Sicilia'),
 (SELECT id FROM skills WHERE name = 'Diritto Societario & Commerciale'),
 'Supporto alla costituzione srl impresa sociale, definizione statuto, oggetto sociale e step operativi',
 'high'),
((SELECT id FROM projects WHERE name = 'Nexo Sicilia'),
 (SELECT id FROM skills WHERE name = 'Business Development'),
 'Definizione strategia di sviluppo: analisi bisogni imprese, profilazione target per match, gestione database, efficientamento procedure',
 'high'),
((SELECT id FROM projects WHERE name = 'Nexo Sicilia'),
 (SELECT id FROM skills WHERE name = 'Project Management'),
 'Progettazione e rendicontazione — revisione procedure e gestione interna',
 'medium'),
((SELECT id FROM projects WHERE name = 'Nexo Sicilia'),
 (SELECT id FROM skills WHERE name = 'Operations & Logistica'),
 'Facility management per accoglienza e gestione appartamenti',
 'medium');

-- Zagara
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'Zagara'),
 (SELECT id FROM skills WHERE name = 'Diritto Societario & Commerciale'),
 'Forma giuridica (modello duale): costituiranno srl IS a fianco dell''associazione, aiutarli a comprendere la gestione delle due organizzazioni',
 'high'),
((SELECT id FROM projects WHERE name = 'Zagara'),
 (SELECT id FROM skills WHERE name = 'Business Development'),
 'Validazione servizio turismo — servizio in cui hanno meno esperienza diretta al momento',
 'high'),
((SELECT id FROM projects WHERE name = 'Zagara'),
 (SELECT id FROM skills WHERE name = 'Fundraising & Crowdfunding'),
 'Campagna crowdfunding per sostenere presidio territoriale',
 'medium'),
((SELECT id FROM projects WHERE name = 'Zagara'),
 (SELECT id FROM skills WHERE name = 'Community Building & Reti'),
 'Intro a Pionieri segnalati: Giuseppe Macca (Ethics4growth), Santina Giannone (Reputation Lab), Lucia Giuliano (Abadir), Elita Schillaci (UniCT), Chiara Giombarresi (Intrapresa)',
 'medium');

-- Buscemi Rural Hub
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'Buscemi Rural Hub'),
 (SELECT id FROM skills WHERE name = 'Diritto Societario & Commerciale'),
 'Costituzione nuovo ente, focus forme quali fondazione di comunità e associazione. Devono comprendere il soggetto migliore che dialoghi con territorio e PA mantenendo flessibilità su attività commerciali',
 'high'),
((SELECT id FROM projects WHERE name = 'Buscemi Rural Hub'),
 (SELECT id FROM skills WHERE name = 'Strategia Aziendale'),
 'Modello di sviluppo e replicabilità dello stesso anche in altri contesti',
 'medium'),
((SELECT id FROM projects WHERE name = 'Buscemi Rural Hub'),
 (SELECT id FROM skills WHERE name = 'Branding & Storytelling'),
 'Definizione linea comunicativa coerente con il progetto. Analisi target e canali. Focus narrazione storie e racconto per attrarre',
 'medium');

-- L'orto di Pino
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'L''orto di Pino'),
 (SELECT id FROM skills WHERE name = 'Analisi di Mercato'),
 'Tante idee generaliste, non ancora sicure sul target. Ancora in fase di brainstorming, un po'' lente nel validare',
 'high'),
((SELECT id FROM projects WHERE name = 'L''orto di Pino'),
 (SELECT id FROM skills WHERE name = 'Project Management'),
 'Non riescono a trovare tempo per lavorare al progetto soprattutto insieme. Serve project management interno tra loro 4',
 'medium'),
((SELECT id FROM projects WHERE name = 'L''orto di Pino'),
 (SELECT id FROM skills WHERE name = 'Diritto Societario & Commerciale'),
 'Forma giuridica: cooperativa (tipo A e B) o azienda agricola? O partire da un''associazione?',
 'medium');

-- Progetto Spora
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'Progetto Spora'),
 (SELECT id FROM skills WHERE name = 'Diritto Societario & Commerciale'),
 'Forma giuridica e proposta di valore: vorrebbero fare qualcosa di più innovativo e sociale rispetto a un''azienda agricola classica',
 'high'),
((SELECT id FROM projects WHERE name = 'Progetto Spora'),
 (SELECT id FROM skills WHERE name = 'Business Development'),
 'Creazione community, penetrazione mercato e sviluppo commerciale. Capire come creare una community che diventa anche primi consumatori (ristoranti, hotel)',
 'high'),
((SELECT id FROM projects WHERE name = 'Progetto Spora'),
 (SELECT id FROM skills WHERE name = 'Leadership & Governance'),
 'Tante teste con tante idee diverse (troppe). Manca confronto interno profondo, due fazioni: più agricola vs più innovazione sociale/comunitario',
 'high');

-- La casa delle lavoratrici Angela Rizzo
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'La casa delle lavoratrici Angela Rizzo'),
 (SELECT id FROM skills WHERE name = 'Risorse Umane & Talent'),
 'Mancanza braccianti agricoli per il progetto',
 'medium'),
((SELECT id FROM projects WHERE name = 'La casa delle lavoratrici Angela Rizzo'),
 (SELECT id FROM skills WHERE name = 'Marketing Digitale'),
 'Mancanza di expertise lato marketing e progettazione. Chiedono confronto con esperto di analisi del business',
 'medium'),
((SELECT id FROM projects WHERE name = 'La casa delle lavoratrici Angela Rizzo'),
 (SELECT id FROM skills WHERE name = 'Community Building & Reti'),
 'Mancanza di rete generale: conoscere persone, aziende, enti con cui parlare e fare rete',
 'medium'),
((SELECT id FROM projects WHERE name = 'La casa delle lavoratrici Angela Rizzo'),
 (SELECT id FROM skills WHERE name = 'Fundraising & Crowdfunding'),
 'Come trovare capitale di finanziamento. Difficoltà nel trovare agronomi per supportare pratiche bandi',
 'medium');

-- MAQALUBA
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'MAQALUBA'),
 (SELECT id FROM skills WHERE name = 'Diritto Societario & Commerciale'),
 'Forma giuridica: ipotesi formula duplice associazione + impresa sociale per attività commerciali',
 'high'),
((SELECT id FROM projects WHERE name = 'MAQALUBA'),
 (SELECT id FROM skills WHERE name = 'Operations & Logistica'),
 'Sviluppo organizzativo — modalità di gestione orizzontali',
 'medium'),
((SELECT id FROM projects WHERE name = 'MAQALUBA'),
 (SELECT id FROM skills WHERE name = 'Community Building & Reti'),
 'Lavoro sul processo di costruzione di una rete tra vari attori locali (partnership)',
 'high');

-- UNNA
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'UNNA'),
 (SELECT id FROM skills WHERE name = 'Strategia Aziendale'),
 'Modello economico & revenue model: definire revenue model sostenibile (SaaS subscription + offering aggiuntivi), pricing iniziale, unit economics (CAC, LTV, gross margin), scenari 36 mesi',
 'high'),
((SELECT id FROM projects WHERE name = 'UNNA'),
 (SELECT id FROM skills WHERE name = 'Community Building & Reti'),
 'Rete & credibilità: ottenere push di credibilità e accesso per facilitare contatti con enti, amministrazioni e reti territoriali. Servono 2 lettere di endorsement + 10 intro calde entro 60 gg',
 'high');

-- Polaris
INSERT INTO project_needs (project_id, skill_id, description, urgency) VALUES
((SELECT id FROM projects WHERE name = 'Polaris'),
 (SELECT id FROM skills WHERE name = 'Business Development'),
 'Validazione idea, creazione mock-up, product-market-fit, go-to-market. Da definire meglio modello di business e sistema dell''offerta',
 'high'),
((SELECT id FROM projects WHERE name = 'Polaris'),
 (SELECT id FROM skills WHERE name = 'Branding & Storytelling'),
 'Creazione della brand identity e dei canali digital. Previa definizione proposta di valore e sistema dell''offerta',
 'medium'),
((SELECT id FROM projects WHERE name = 'Polaris'),
 (SELECT id FROM skills WHERE name = 'Analisi di Mercato'),
 'Benchmarking: coop sociali B in ambito digitale, analisi competitor, aspetti legali per European Accessibility Act',
 'medium');

COMMIT;
