-- Migration: Add keywords column to skills table
-- Run this in the Supabase SQL Editor to add keyword-based matching for CSV import

ALTER TABLE skills ADD COLUMN IF NOT EXISTS keywords text;

-- Seed default keywords for existing skills
UPDATE skills SET keywords = 'ux, user experience, usabilità, esperienza utente' WHERE name = 'UX Design' AND keywords IS NULL;
UPDATE skills SET keywords = 'ui, user interface, interfaccia' WHERE name = 'UI Design' AND keywords IS NULL;
UPDATE skills SET keywords = 'web develop, sviluppat, developer, frontend, backend, full-stack, fullstack, software, programmator, informatica' WHERE name = 'Web Development' AND keywords IS NULL;
UPDATE skills SET keywords = 'mobile, ios, android, app develop' WHERE name = 'Mobile Development' AND keywords IS NULL;
UPDATE skills SET keywords = 'data analy, data scien, analisi dati, statistic, analytics, big data, machine learning' WHERE name = 'Data Analysis' AND keywords IS NULL;
UPDATE skills SET keywords = 'project manag, gestione progett, coordinat, program manager' WHERE name = 'Project Management' AND keywords IS NULL;
UPDATE skills SET keywords = 'finanz, financial, investment, banker, finance, contabil, economis, economia' WHERE name = 'Financial Planning' AND keywords IS NULL;
UPDATE skills SET keywords = 'marketing, commerciale, vendite, sales, growth, brand manager' WHERE name = 'Marketing' AND keywords IS NULL;
UPDATE skills SET keywords = 'strateg, ceo, founder, co-founder, direttore, direttrice, presidente, managing director, imprendit, chief' WHERE name = 'Strategia' AND keywords IS NULL;
UPDATE skills SET keywords = 'comunicazion, communication, giornalis, stampa, relazioni pubbliche, public relation, social media' WHERE name = 'Comunicazione' AND keywords IS NULL;
UPDATE skills SET keywords = 'graphic design, grafico, grafica, illustrat, art director, visual design' WHERE name = 'Graphic Design' AND keywords IS NULL;
UPDATE skills SET keywords = 'copywriter, copywriting, scrittore, scrittrice, redazion, editorial, content' WHERE name = 'Copywriting' AND keywords IS NULL;
UPDATE skills SET keywords = 'video, filmmaker, videomaker, regista, cinema, audiovisiv' WHERE name = 'Video Production' AND keywords IS NULL;
UPDATE skills SET keywords = 'legal, avvocat, legale, giuridic, diritto, notaio, lawyer, attorney, giurist' WHERE name = 'Legal' AND keywords IS NULL;
UPDATE skills SET keywords = 'risorse umane, human resource, recruiting, talent, personale' WHERE name = 'HR / Risorse Umane' AND keywords IS NULL;
UPDATE skills SET keywords = 'fundraising, raccolta fondi, grant, donazioni, filantropia' WHERE name = 'Fundraising' AND keywords IS NULL;
UPDATE skills SET keywords = 'consulen, consultant, consulting, advisor, policy, esperto, professore, professoressa, ricercat, università, accademi, docente' WHERE name = 'Consulenza' AND keywords IS NULL;
