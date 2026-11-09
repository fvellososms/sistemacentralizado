-- Obra da empresa cliente PETMAX. Endereço, gestor e data podem ser ajustados em Administração > Obras.
INSERT INTO "projects" ("name", "code", "company_name", "address", "manager_name", "status", "start_date", "client_company_id")
SELECT 'Fábrica PETMAX', 'FP-01', 'PETMAX', 'Endereço Fábrica PETMAX', 'Gerente', 'Em andamento', '2026-11-09', "id"
FROM "client_companies"
WHERE "name" = 'PETMAX' AND NOT EXISTS (SELECT 1 FROM "projects" WHERE "name" = 'Fábrica PETMAX');
