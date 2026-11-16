-- Administrador principal: nome correto e sem foto.
UPDATE "user_profiles" SET "name" = 'Fábio Velloso', "avatar_url" = NULL, "updated_at" = now() WHERE lower("email") = 'fvellososms@gmail.com';--> statement-breakpoint
UPDATE "usuarios" SET "nome" = 'Fábio Velloso' WHERE lower("email") = 'fvellososms@gmail.com';--> statement-breakpoint
-- Equipe: senha padrão (só o hash scrypt fica aqui) com troca obrigatória no primeiro acesso.
-- Cargo e departamento ficam em branco para o administrador preencher em Administração > Usuários.
INSERT INTO "user_profiles" ("name", "email", "role", "department", "password_hash", "access_level", "active", "must_change_password") VALUES
	('Nicole Soeiro', 'nicolesoeiroofc@gmail.com', '', '', 'scrypt$16384$8$1$D80Shvct/WHe3ZNriLQNpA==$o1u3f1AT7sd3V3+3Zh2z8DvP5PhtBLNxn1Lkkgdy6+9ycJIk7PIkJMzdNdMCqcX89HnfrqepdoY5rQER9bEFVQ==', 'usuario', true, true),
	('Alberto Martins', 'osifrancis11.ams@gmail.com', '', '', 'scrypt$16384$8$1$MrUUxt5nr9UL2wcgzsiB7Q==$vp4HmJcxuUaH8W0TsFGGlXSE0P28u+dQNwNssx6Mgb/7NkUox9sstYX8459qhuEkM9AkoWgxWQNzBrFMv6CPsA==', 'usuario', true, true),
	('Davi José', 'davijosemelloferreira@gmail.com', '', '', 'scrypt$16384$8$1$7bNoggJWLXOpMALK8B25Ww==$0FCgtQqqfyLjl1vxzN6KAiBCR8jOeTQVP5MuPPluEnVomKv/quWAGx98fV/4skW28ujVn4X6IRVpLxElqVj4bw==', 'usuario', true, true)
ON CONFLICT ("email") DO NOTHING;
