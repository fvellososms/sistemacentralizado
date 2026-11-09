CREATE TABLE "checklist_fotos" (
	"id" serial PRIMARY KEY NOT NULL,
	"inspecao_id" integer NOT NULL,
	"ordem" integer NOT NULL,
	"caminho" varchar(255) NOT NULL,
	"tipo" varchar(40) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_inspecoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" varchar(36) NOT NULL,
	"modelo_id" integer,
	"modelo_nome" varchar(255) NOT NULL,
	"project_id" integer,
	"project_name" varchar(255),
	"empresa_cliente" varchar(180),
	"numero" varchar(255) DEFAULT '' NOT NULL,
	"revisao" varchar(255) DEFAULT '' NOT NULL,
	"contratada" varchar(255) DEFAULT '' NOT NULL,
	"subcontratada" varchar(255) DEFAULT '' NOT NULL,
	"local" varchar(255) DEFAULT '' NOT NULL,
	"grupo" varchar(255) DEFAULT '' NOT NULL,
	"frente" varchar(255) DEFAULT '' NOT NULL,
	"objeto" varchar(255) DEFAULT '' NOT NULL,
	"tag" varchar(255) DEFAULT '' NOT NULL,
	"periodicidade" varchar(255) DEFAULT '' NOT NULL,
	"inspetor" varchar(255) DEFAULT '' NOT NULL,
	"data_inspecao" varchar(10) NOT NULL,
	"nome_tecnico" varchar(255) DEFAULT '' NOT NULL,
	"nome_operador" varchar(255) DEFAULT '' NOT NULL,
	"assinatura_tecnico" text,
	"assinatura_operador" text,
	"criado_por_id" integer,
	"criado_por_nome" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_inspecoes_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "checklist_modelo_itens" (
	"id" serial PRIMARY KEY NOT NULL,
	"modelo_id" integer NOT NULL,
	"ordem" integer NOT NULL,
	"pergunta" text NOT NULL,
	"icone" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "checklist_modelos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_modelos_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "checklist_respostas" (
	"id" serial PRIMARY KEY NOT NULL,
	"inspecao_id" integer NOT NULL,
	"ordem" integer NOT NULL,
	"pergunta" text NOT NULL,
	"icone" varchar(120),
	"resposta" varchar(20) NOT NULL,
	"comentario" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checklist_fotos" ADD CONSTRAINT "checklist_fotos_inspecao_id_checklist_inspecoes_id_fk" FOREIGN KEY ("inspecao_id") REFERENCES "public"."checklist_inspecoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_inspecoes" ADD CONSTRAINT "checklist_inspecoes_modelo_id_checklist_modelos_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."checklist_modelos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_modelo_itens" ADD CONSTRAINT "checklist_modelo_itens_modelo_id_checklist_modelos_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."checklist_modelos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_respostas" ADD CONSTRAINT "checklist_respostas_inspecao_id_checklist_inspecoes_id_fk" FOREIGN KEY ("inspecao_id") REFERENCES "public"."checklist_inspecoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_fotos_inspecao_ordem_idx" ON "checklist_fotos" USING btree ("inspecao_id","ordem");--> statement-breakpoint
CREATE INDEX "checklist_inspecoes_project_data_idx" ON "checklist_inspecoes" USING btree ("project_id","data_inspecao");--> statement-breakpoint
CREATE INDEX "checklist_modelo_itens_modelo_idx" ON "checklist_modelo_itens" USING btree ("modelo_id","ordem");--> statement-breakpoint
CREATE INDEX "checklist_respostas_inspecao_idx" ON "checklist_respostas" USING btree ("inspecao_id","ordem");--> statement-breakpoint
-- Modelos iniciais: checklists do FVCheck (Davi Mello Ferreira, em colaboração com a FVelloso Consultoria em SMS).
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Alisadora de Piso') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O FUNCIONAMENTO DO MOTOR É BOM?',NULL),
  (2,'O MOTOR APRESENTA LIVRE DE VAZAMENTOS?',NULL),
  (3,'O TANQUE DE COMBUSTÍVEL ESTÁ EM BOM ESTADO E COM TAMPA?',NULL),
  (4,'AS MANGUEIRAS DE COMBUSTÍVEL APRESENTAM LIVRE DE VAZAMENTOS?',NULL),
  (5,'A ALÇA DE EMPUNHADURA ESTÁ EM BOM ESTADO?',NULL),
  (6,'AS HÉLICES DO SISTEMA ALISAMENTO ESTÃO EM BOM ESTADO?',NULL),
  (7,'AS PROTEÇÕES DE PEÇAS EM MOVIMENTO ESTÁ CORRETA?',NULL),
  (8,'AS CORREIAS ESTÃO EM BOM ESTADO?',NULL),
  (9,'OS CORDÕES DE PARTIDA ESTÃO EM BOM ESTADO.',NULL),
  (10,'O SEU ASPECTO EM GERAL É BOM?',NULL),
  (11,'AS CORREIAS ESTÃO COM AS PROTEÇÃO?',NULL),
  (12,'OPERADOR E QUALIFICADO?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Armazenamento Provisorio de Inflamaveis') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'BAIA CADASTRADA NO PGR/APR DO CANTEIRO?',NULL),
  (2,'PROCEDIMENTOS DE ARMAZENAMENTO CONFORME NR-20?',NULL),
  (3,'SINALIZAÇÃO VISÍVEL DE “INFLAMÁVEL”, “PROIBIDO FUMAR” E “PERIGO”?',NULL),
  (4,'PLACA COM CAPACIDADE MÁXIMA DE ARMAZENAMENTO?',NULL),
  (5,'IDENTIFICAÇÃO DO RESPONSÁVEL PELA ÁREA?',NULL),
  (6,'BAIA EM ÁREA VENTILADA E AFASTADA DE FONTES DE IGNIÇÃO (> 3 M)?',NULL),
  (7,'DISTÂNCIA SEGURA DE OBRAS QUENTES (SOLDA, CORTE E ESMERILHAMENTO)?',NULL),
  (8,'PISO NIVELADO, FIRME E SEM ACÚMULO DE COMBUSTÍVEIS?',NULL),
  (9,'ACESSO LIVRE PARA VEÍCULOS DE EMERGÊNCIA?',NULL),
  (10,'CERCAMENTO ADEQUADO (MADEIRA, METÁLICO OU GRADIL)?',NULL),
  (11,'PORTÃO COM FECHAMENTO E CONTROLE DE ACESSO?',NULL),
  (12,'COBERTURA RESISTENTE E VENTILADA?',NULL),
  (13,'VENTILAÇÃO NATURAL CRUZADA SEM OBSTRUÇÕES?',NULL),
  (14,'PROTEÇÃO CONTRA INTEMPÉRIES (CHUVA E UMIDADE)?',NULL),
  (15,'HÁ MATERIAIS INCOMPATÍVEIS ARMAZENADOS JUNTO AOS INFLAMÁVEIS?',NULL),
  (16,'EXTINTORES CLASSE BC OU ABC PRÓXIMOS E ACESSÍVEIS?',NULL),
  (17,'EXTINTOR DE INCÊNDIO É PROPORCIONAL, INSPECIONADO E CARREGADO?',NULL),
  (18,'EXTINTORES COM CARGA VÁLIDA E LACRE INTACTO?',NULL),
  (19,'KIT DE CONTENÇÃO DE VAZAMENTOS DISPONÍVEL?',NULL),
  (20,'AREIA OU MATERIAL ABSORVENTE PARA DERRAMAMENTO?',NULL),
  (21,'ARMAZENAMENTO ORGANIZADO EM ESTRADOS OU PRATELEIRAS?',NULL),
  (22,'GALÕES/TAMBORES SEM VAZAMENTOS, AMASSADOS OU CORROSÃO?',NULL),
  (23,'RECIPIENTES BEM FECHADOS, COM TAMPA E LACRE?',NULL),
  (24,'BOTIJÕES DE GLP EM POSIÇÃO VERTICAL E COM BOA VENTILAÇÃO?',NULL),
  (25,'ÁREA LIMPA E ORGANIZADA, SEM RESÍDUOS INFLAMÁVEIS?',NULL),
  (26,'COLABORADORES COM CAPACITAÇÃO EM NR-20?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Avaliação Comportamental') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'USO DO CAPACETE?','01_capacete.svg'),
  (2,'USO DO PROTETOR AURICULAR?','02_protetor_auricular.svg'),
  (3,'USO DO ÓCULOS DE PROTEÇÃO?','03_oculos.svg'),
  (4,'USO DE PROTEÇÃO RESPIRATÓRIA?','04_protecao_respiratoria.svg'),
  (5,'USO DE BOTA DE SEGURANÇA (COURO)?','05_bota.svg'),
  (6,'USO DE CINTO DE SEGURANÇA?','06_cinto_paraquedista.svg'),
  (7,'USO DE LUVA DE SEGURANÇA?','07_luva.svg'),
  (8,'USO DE PROTEÇÃO FACIAL?','08_protecao_facial.svg'),
  (9,'USO DE UNIFORME?','09_uniforme.svg'),
  (10,'USO DE COLETE E/OU X REFLETIVO?','10_colete_refletivo.svg'),
  (11,'ÁREA DE TRABALHO ISOLADA E SINALIZADA?','11_area_isolada.svg')
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Banheiro Químico') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O banheiro químico dispõe de porta contra devassamento, com sistema de travamento funcionando e em boas condições?',NULL),
  (2,'O banheiro químico dispõe de papel higiênico?',NULL),
  (3,'A grade de ventilação do banheiro químico está em boas condições?',NULL),
  (4,'O vaso sanitário está em boas condições de uso e higiene?',NULL),
  (5,'O lavatório está em boas condições de uso e higiene?',NULL),
  (6,'O mictório está em boas condições de uso e higiene?',NULL),
  (7,'O piso, as paredes e a cobertura do banheiro químico estão em boas condições de uso e higiene?',NULL),
  (8,'O banheiro químico dispõe de controle de higienização fixado em local visível?',NULL),
  (9,'Há higienização diária do banheiro químico?',NULL),
  (10,'O banheiro químico dispõe de coletor com tampa para papel usado?',NULL),
  (11,'Foi disponibilizado álcool em gel para higienização das mãos?',NULL),
  (12,'O banheiro químico está localizado a uma distância máxima de 150 metros dos postos de trabalho?',NULL),
  (13,'O banheiro químico está localizado a uma distância segura da movimentação de cargas, veículos e equipamentos?',NULL),
  (14,'O banheiro químico está localizado a uma distância segura de taludes e de redes elétricas energizadas?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Bob Cat') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'ALARME DE MARCHA RÉ ESTÁ FUNCIONANDO?',NULL),
  (2,'ALAVANCAS DE COMANDO CONFORME?',NULL),
  (3,'BUZINA ESTÁ FUNCIONANDO?',NULL),
  (4,'VIDROS EM BOM ESTADO, LIMPEZA E CONSERVAÇÃO SATISFATÓRIAS?',NULL),
  (5,'CONCHA EM BOM ESTADO DE CONSERVAÇÃO, COM UNHAS ÍNTEGRAS E SEM TRINCAS.',NULL),
  (6,'ESTÁ LIVRE DE VIBRAÇÕES E RUÍDOS ANORMAIS QUANDO EM FUNCIONAMENTO?',NULL),
  (7,'CINTO DE SEGURANÇA EM CONDIÇÕES ADEQUADAS DE USO?',NULL),
  (8,'CRACHÁ DO OPERADOR PRESENTE, COM ASO DENTRO DA VALIDADE ANUAL?',NULL),
  (9,'OPERADOR CAPACITADO COM CURSO DE DIREÇÃO DEFENSIVA?',NULL),
  (10,'OPERADOR COM EPI E UNIFORME COMPLETOS E ADEQUADOS?',NULL),
  (11,'ESPELHOS RETROVISORES EM BOM ESTADO E COM VISIBILIDADE ADEQUADA?',NULL),
  (12,'EXTINTOR DE INCÊNDIO DISPONÍVEL E EM CONDIÇÕES DE USO?',NULL),
  (13,'ILUMINAÇÃO INTERNA E EXTERNA FUNCIONAL?',NULL),
  (14,'INSTRUMENTOS DO PAINEL, LIMPADOR DE PARA-BRISA, LUZES DE FREIO, LUZES DE RÉ E LUZES DE ADVERTÊNCIA (GIROFLEX) FUNCIONAIS E OPERANTES.?',NULL),
  (15,'PEDAIS DE COMANDO (ACELERADOR E EMBREAGEM) EM FUNCIONAMENTO ADEQUADO?',NULL),
  (16,'PISCA-ALERTA E SETAS DIANTEIRAS E TRASEIRAS FUNCIONAIS E OPERANTES?',NULL),
  (17,'PROFISSIONAL QUALIFICADO E HABILITADO PARA A ATIVIDADE?',NULL),
  (18,'PNEUS EM BOM ESTADO DE CONSERVAÇÃO, SISTEMA DE FREIOS E HIDRÁULICO OPERANTES, TEOR DE FULIGEM DENTRO DOS PADRÕES, TAMPA DO TANQUE DE COMBUSTÍVEL ÍNTEGRA, MOTOR EM BOM FUNCIONAMENTO?',NULL),
  (19,'KIT DE MEIO AMBIENTE DISPONÍVEL.?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - CIlindro de Gases') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'As mangueiras são especificas para a operação ( cores vermelha:combustível e verde: oxigênio',NULL),
  (2,'Apresentam algum tipo de avaria ( trincas, pontos queimados,rompimento da malha, sinais de corte, prensagem',NULL),
  (3,'Estão isentas de graxas / óleos',NULL),
  (4,'A fixação é feita através de braçadeiras',NULL),
  (5,'As canetas possuem em suas entradas válvulas de corta fluxo',NULL),
  (6,'Os registros ( abre/fecha  dos gases ) das canetas estão funcionando bem',NULL),
  (7,'Os cilindros de gases possuem em suas saídas válvulas corta chama',NULL),
  (8,'Em caso de cilindros móveis o mesmo encontra-se sobre carrinho',NULL),
  (9,'Há extintor disponivel no local',NULL),
  (10,'Após serem usadas são acondicionadas em seus respectivos suportes',NULL),
  (11,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Cabo de Aço') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O cabo não apresenta três ou mais arames partidos/rompidos agrupados proximamente',NULL),
  (2,'O cabo não apresenta torções, estrangulamentos ou dobras',NULL),
  (3,'O cabo não apresenta sinais de corrosão',NULL),
  (4,'O cabo não apresenta sinais de desgaste ou alongamento',NULL),
  (5,'O cabo não apresenta formação de gaiolas',NULL),
  (6,'O cabo não apresenta a alma saltada',NULL),
  (7,'O cabo não se mantém na forma de espiral',NULL),
  (8,'O cabo não apresenta desgaste excessivo',NULL),
  (9,'O cabo não apresenta distorção e desgaste do anel de carga ou fechamento das sapatilhas',NULL),
  (10,'O cabo não apresenta trincas nas presilhas',NULL),
  (11,'O cabo não apresenta abrasão ou amassamento severo da presilha ou do trançado',NULL),
  (12,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Cinta de Carga') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'Cinta Limpa e em perfeito estado de conservação',NULL),
  (2,'Cintas possuem identificação visível da sua capacidade',NULL),
  (3,'Ancoragens fixas em estrutura devem ser conforme indicado; "CORRETO"',NULL),
  (4,'Nunca montar a cinta / ancorar em local com canto vivo / cortante',NULL),
  (5,'Peças devem ser amarradas da melhor forma possível em razão do formato da peça',NULL),
  (6,'Acessórios para uso com cintas devem estar em perfeito estado de conservação',NULL),
  (7,'Consultar tabela de dimensionamento para escolher a cinta adequado ao trabalho',NULL),
  (8,'As cintas não apresentam rasgos ou desfiamento de suas fibras',NULL),
  (9,'As cintas não apresentam perfurações ou defeitos nas costuras',NULL),
  (10,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Escada Plataforma') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A ESTRUTURA, INCLUINDO OS DEGRAUS, CORRIMÃO E TRAVAS ESTÃO FIXAS E SEM TRINCAS',NULL),
  (2,'AS SAPATAS NOS PÉS ESTÃO FIXAS E EM BOM ESTADO DE CONSERVAÇÃO',NULL),
  (3,'AS RODAS ESTÃO PERFEITAS PARA TRANSFERÊNCIA DO EQUIPAMENTO COM SEGURANÇA',NULL),
  (4,'OS DEGRAUS ESTÃO SECOS E LIVRES DE OBSTÁCULOS QUE POSSAM GERAR RISCOS',NULL),
  (5,'EXISTE NÚMERO/TAG DE IDENTIFICAÇÃO DO EQUIPAMENTO',NULL),
  (6,'EXISTE SINALIZAÇÃO DE CAPACIDADE SUPORTADA',NULL),
  (7,'EXISTE ANCORAGEM SEGURA PARA TRABALHOS ACIMA DE 2 METROS DE ALTURA',NULL),
  (8,'EXISTE "APOIO DE 03 (TRÊS) PONTOS DURANTE A UTILIZAÇÃO DO EQUIPAMENTO',NULL),
  (9,'É DE CONHECIMENTO A PROIBIÇÃO DO USO DE ESCADAS DE ALUMÍNIO PARA ATIVIDADES ELÉTRICAS',NULL),
  (10,'HÁ PONTOS DE FIXAÇÃO PARA A ESCADA CASO HAJA NECESSIDADE',NULL),
  (11,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Extensões Elétricas') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'Inspecione estado dos engates e pinos',NULL),
  (2,'Inspecione estado fisico das tomadas e proteções',NULL),
  (3,'Verificar o estado no conector MACHO da tomada',NULL),
  (4,'Cabos elétricos sem fissuras e emendas',NULL),
  (5,'Verificar o estado no conector FEMEA da tomada',NULL),
  (6,'PROIBIDO realizar  "rabicho" na extensão elétrica',NULL),
  (7,'Equipamento recebeu TAG de inspeção da Segurança do Trabalho Local',NULL),
  (8,'TODOS OS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Furadeira') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'CHAVE LIGA / DESLIGA (GATILHO) = FUNCIONANDO',NULL),
  (2,'IDENTIFICAÇÃO DA EMPRESA / SETOR PROPRIETÁRIO DO EQUIPAMENTO',NULL),
  (3,'MANOPLA LATERAL PRESA (QUANDO EXISTIR)',NULL),
  (4,'BROCA CORRETA E MANDRIL APERTADO',NULL),
  (5,'CABO ELÉTRICO EM BOM ESTADO, SEM EMENDAS',NULL),
  (6,'CHAVE DE MANDRIL EM BOM ESTADO',NULL),
  (7,'CHAVE DE MANDRIL PRESA AO CABO ELÉTRICO E JUNTO AO PLUG',NULL),
  (8,'NORMA OPERACIONAL VISÍVEL NA ÁREA DE TRABALHO',NULL),
  (9,'A ATIVIDADE POSSUI APR/PROCEDIMENTO/IT',NULL),
  (10,'FOI EMITIDA PERMISSÃO DE TRABALHO',NULL),
  (11,'TREINAMENTO DENTRO DA VALIDADE DETERMINADA',NULL),
  (12,'PORTA CARTEIRA FUNCIONAL PADRÃO KERRY (CAPACITAÇÃO E HABILITAÇÃO)',NULL),
  (13,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Gerador') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'CHAVE LIGA / DESLIGA (FUNCIONANDO)',NULL),
  (2,'CONDIÇÕES TANQUE DE COMBUSTÍVEL',NULL),
  (3,'TANQUE DE COMBUSTÍVEL FECHADO (TAMPA)',NULL),
  (4,'CONDIÇÕES DOS FIOS (EXPOSTOS)',NULL),
  (5,'CONDIÇÕES DO SUPORTE DE FIXAÇÃO',NULL),
  (6,'PROTEÇÃO DO PLUG DA TOMADA',NULL),
  (7,'EXTINTOR DE INCÊNDIO TIPO PQS-ABC PADRÃO P1/P2 (CARGA E VALIDADE)',NULL),
  (8,'PARTES MÓVEIS DO MOTOR (POLIA, CORREIA ETC), PROTEGIDAS',NULL),
  (9,'UNIDADE GERADORA SEM VAZAMENTOS (COMBUSTÍVEL)',NULL),
  (10,'NORMA OPERACIONAL VISÍVEL NA ÁREA DE TRABALHO',NULL),
  (11,'TRAVAMENTO DOS PNEUS',NULL),
  (12,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Inspeção diária de talha elétrica') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O estado de conservação geral é satisfatório e com lubrificação satisfatória.',NULL),
  (2,'As correntes/cabo de aço estão em boas condições (sem desgastes, solda, amassados, trincas e outros aspectos que comprometam sua resistência).',NULL),
  (3,'Os dentes das engrenagens internas encontram-se em bom estado, sem desgaste severo.',NULL),
  (4,'Está equipada com freio de carga mecânico, que permita controlar a velocidade de subida e descida da carga e funcionando adequadamente.',NULL),
  (5,'O gancho possui trava e está em boas condições.',NULL),
  (6,'Possui dispositivo de fim de curso.',NULL),
  (7,'Possui sistema de movimento de elevação provido de dispositivo de frenagem de segurança no caso de interrupção no fornecimento de energia elétrica.',NULL),
  (8,'Pontos de fixação da talha encontram-se em condições ideais para carregamento da carga (sem trincas, desgastes, parafusos etc.).',NULL),
  (9,'A talha corresponde à carga a ser movimentada/içada e a sinalização nos comandos direcionais está adequada.',NULL),
  (10,'Possui chave de bloqueio removível para os controles remotos, e os cabos e extensões de alimentação estão em perfeitas condições',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Lava-Olhos') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'Tem placa de sinalização visível',NULL),
  (2,'A válvula de acionamento do chuveiro e do lava-olhos permanece aberta sem o uso das mãos até que  intencionalmente seja fechada.',NULL),
  (3,'O lava-olhos tem um fluxo controlado de água simultaneamente para ambos os olhos Os esguichos do lava-olhos estão protegidos por tampa e sua abertura é automática quando acionado o',NULL),
  (4,'equipamento."',NULL),
  (5,'O equipamento está livre de obstruções e é de fácil acesso?',NULL),
  (6,'O equipamento está em bom estado de conservação (sem ferrugens e danos à estrutura)?',NULL),
  (7,'Altura mínima do jato d''água do lava-olhos/face é de 20 cm?',NULL),
  (8,'Fluxo de água quando acionado é rápido?',NULL),
  (9,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Lavadora de Piso') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'Verificar bateria,Verificar nivél da água da bateria',NULL),
  (2,'Verificar comandos da máquina',NULL),
  (3,'Verificar funcionamento da buzina',NULL),
  (4,'Verificar funcionamento do sinal luminoso',NULL),
  (5,'Verificar funcionamento das escovas e rodos de sucção',NULL),
  (6,'Verificar funcionamento da luz frontal',NULL),
  (7,'Verificar funcionamento do cinto de segurança',NULL),
  (8,'Verificar funcionamento do sensor de movimento do banco',NULL),
  (9,'Testar sistma de RÉ e sinal sonoro',NULL),
  (10,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Manipulador Telescopio') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A TABELA DE CARGAS ESTÁ DISPONÍVEL AO OPERADOR?',NULL),
  (2,'AS ALAVANCAS DE COMANDO E O SISTEMA OPERACIONAL?',NULL),
  (3,'ASSENTOS FIXOS COM CINTO DE SEGURANÇA (TRÊS PONTOS NA FRENTE) E ENCOSTO DE CABEÇA?',NULL),
  (4,'BANDEIROLA E GIROFLEX FUNCIONANDO (CONDICIONAL)?',NULL),
  (5,'BUZINA, VOLANTE, EMBREAGEM, ACELERADOR, SISTEMA DE FREIOS, DISPOSITIVOS DE COMANDO E CHAVE GERAL PARA DESENERGIZAÇÃO DO SISTEMA ELÉTRICO FUNCIONANDO?',NULL),
  (6,'CONDIÇÕES DA CABINE E DOS PNEUS ESTÃO BOAS (TWI – TYRE WEAR INDICATOR)?',NULL),
  (7,'DISPOSITIVO DE ACIONAMENTO AUTOMÁTICO DOS FARÓIS, QUANDO DO ACIONAMENTO DA IGNIÇÃO, FUNCIONANDO?',NULL),
  (8,'EXTINTOR DE INCÊNDIO É PROPORCIONAL AO VEÍCULO, INSPECIONADO E CARREGADO?',NULL),
  (9,'FITAS REFLETIVAS EM SEUS LADOS EXTERNOS?',NULL),
  (10,'GARFOS E TAMPAS DE VENTILAÇÃO ESTÃO LIVRES DE RACHADURAS E TRINCAS?',NULL),
  (11,'KIT DE EMERGÊNCIA COMPLETO, ARMAZENADO ADEQUADAMENTE E COM LISTAGEM DOS ITENS?',NULL),
  (12,'LIMPADOR E ESGUICHO DE ÁGUA PARA PARA-BRISA ESTÃO FUNCIONANDO?',NULL),
  (13,'O SISTEMA HIDRÁULICO, AS CONEXÕES E AS MANGUEIRAS APRESENTAM BOAS CONDIÇÕES, SEM VAZAMENTOS E COM CONEXÕES POR DISPOSITIVOS ESPECÍFICOS?',NULL),
  (14,'PARA-BRISA E ESPELHOS RETROVISORES (INTERNO E EXTERNO) PROPORCIONANDO CONDIÇÕES DE VISIBILIDADE E LIVRES DE DANOS?',NULL),
  (15,'PARA-CHOQUES DIANTEIRO E TRASEIRO EM BOM ESTADO (O TRASEIRO DEVE POSSUIR ALTURA DE 55 CM DO SOLO)?',NULL),
  (16,'PARTES ROTATIVAS MOTORAS TOTALMENTE PROTEGIDAS (CAMINHÃO/IMPLEMENTO)?',NULL),
  (17,'PERFEITO FUNCIONAMENTO DA LANÇA E DO TELESCÓPIO?',NULL),
  (18,'POSSUI CALÇOS PARA O VEÍCULO, CONES E FITAS ZEBRADAS?',NULL),
  (19,'POSSUI MAÇANETAS COM TRANCAS NAS PORTAS?',NULL),
  (20,'POSSUI TRIÂNGULO, CHAVE DE RODA, PNEU ESTEPE E MACACO?',NULL),
  (21,'POSSUI PLACAS COM OS LIMITES DE CAPACIDADE NOMINAL DE CARGA E DE PESSOAS NA CESTA?',NULL),
  (22,'SETAS DIANTEIRAS E TRASEIRAS, LUZ DE FREIO, LUZ DE NEBLINA, ALARME E LUZ DE MARCHA À RÉ, PISCA-ALERTA E COMUTAÇÃO DOS FARÓIS ALTO/BAIXO ESTÃO FUNCIONANDO?',NULL),
  (23,'SISTEMA DE ELEVAÇÃO, BLOQUEIOS E TRAVAS PARA ACESSÓRIOS E CILINDROS HIDRÁULICOS ESTÃO FUNCIONANDO?',NULL),
  (24,'O ABASTECIMENTO DE COMBUSTÍVEL OCORRE EM LOCAL RESERVADO, COM O VEÍCULO PARADO E SEM IGNIÇÃO?',NULL),
  (25,'POSSUI PROTEÇÃO PARA O OPERADOR EM CASO DE CAPOTAMENTO E QUEDA DE MATERIAIS (“ROPS” E “FOPS”)?',NULL),
  (26,'POSSUI CLIMATIZAÇÃO DA CABINE?',NULL),
  (27,'POSSUI RECIPIENTE PARA COLETA DE LIXO?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Martelete') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A empunhadeira possui manopla',NULL),
  (2,'Fiação elétrica em perfeitas condições',NULL),
  (3,'Liga e desliga em perfeitas condições',NULL),
  (4,'Carcaça possui dupla isolação',NULL),
  (5,'Luva anti-vibração por operador',NULL),
  (6,'Possui suporte de descanso',NULL),
  (7,'A ponteira está em boas condições de uso',NULL),
  (8,'O dispositivo de acionamento está em boa condição de funcionamento',NULL),
  (9,'Apresenta vazamento',NULL),
  (10,'Conjunto de agulha está ajustado',NULL),
  (11,'O gatilho está em boas condições de funcionamento',NULL),
  (12,'Trava de segurança do ponteiro está em perfeitas condições',NULL),
  (13,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Mini-Escavadeira') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A CONCHA, CABINE, ESTEIRA, LANÇA E BRAÇO DE ARTICULAÇÃO ESTÃO LIVRES DE AVARIAS E DANOS (TRINCAS, DENTES QUEBRADOS ETC.)?',NULL),
  (2,'A TENSÃO DA ESTEIRA É ADEQUADA?',NULL),
  (3,'ALARME SONORO DE RÉ E MOVIMENTAÇÃO, BUZINA, SISTEMA DE FREIOS, SISTEMA DE ILUMINAÇÃO, INSTRUMENTOS DO PAINEL, HORÍMETRO, LIMPADOR E ESGUICHO DO PARA-BRISA E AMPERÍMETRO ESTÃO LIVRES DE AVARIAS E DANOS?',NULL),
  (4,'AS BORDAS, CANTOS, LÂMINA E PONTA RIPPER ESTÃO LIVRES DE DESGASTES?',NULL),
  (5,'EXISTE EXTINTOR DE INCÊNDIO COMPATÍVEL, CARREGADO E INSPECIONADO?',NULL),
  (6,'EXISTEM ESPELHOS RETROVISORES E ESTÃO EM BOAS CONDIÇÕES DE USO?',NULL),
  (7,'O OPERADOR É HABILITADO E QUALIFICADO?',NULL),
  (8,'OS PARAFUSOS DE FIXAÇÃO DOS ROLETES, DA RODA-GUIA E DAS SAPATAS ESTÃO APERTADOS?',NULL),
  (9,'O SISTEMA HIDRÁULICO E O COMANDO DE GIRO ESTÃO FUNCIONANDO?',NULL),
  (10,'OS CABOS DE AÇO E ACESSÓRIOS ESTÃO EM BOM ESTADO?',NULL),
  (11,'OS ROLETES E A RODA-GUIA ESTÃO LIVRES DE VAZAMENTOS?',NULL),
  (12,'POSSUI CINTO DE SEGURANÇA?',NULL),
  (13,'A PRESSÃO DO ÓLEO E AS TEMPERATURAS DO MOTOR, DA TRANSMISSÃO E DO SISTEMA HIDRÁULICO ESTÃO ADEQUADAS?',NULL),
  (14,'POSSUI PROTEÇÃO PARA O OPERADOR EM CASO DE CAPOTAMENTO E QUEDA DE MATERIAIS (“ROPS” E “FOPS”)?',NULL),
  (15,'POSSUI CLIMATIZAÇÃO DA CABINE?',NULL),
  (16,'POSSUI RECIPIENTE PARA COLETA DE LIXO?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Parafusadeira') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'CHAVE LIGA / DESLIGA (GATILHO) = FUNCIONANDO',NULL),
  (2,'MANDRIL EM BOM ESTADO DE CONSERVAÇÃO',NULL),
  (3,'AJUSTE DE TORQUE FUNCIONANDO PERFEITAMENTE',NULL),
  (4,'SELEÇÃO DE DIREÇÃO " REVERSO" FUNCIONANDO PERFEITAMENTE.',NULL),
  (5,'CABO ELÉTRICO EM BOM ESTADO, SEM EMENDAS',NULL),
  (6,'TRAVA FUNCIONANDO PERFEITAMENTE',NULL),
  (7,'ESTADO DE CONSERVAÇÃO DO EQUIPAMENTO',NULL),
  (8,'NORMA OPERACIONAL VISÍVEL NA ÁREA DE TRABALHO',NULL),
  (9,'A ATIVIDADE POSSUI APR/PROCEDIMENTO',NULL),
  (10,'FOI EMITIDA PERMISSÃO DE TRABALHO',NULL),
  (11,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Retifica') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'CHAVE LIGA / DESLIGA (GATILHO) = FUNCIONANDO',NULL),
  (2,'CONDIÇÃO DO ENGATE FRONTAL',NULL),
  (3,'MANOPLA LATERAL PRESA (QUANDO EXISTIR)',NULL),
  (4,'CABO ELÉTRICO EM BOM ESTADO, SEM EMENDAS',NULL),
  (5,'CHAVE DE MANDRIL EM BOM ESTADO',NULL),
  (6,'HASTE PARA MANDRIL',NULL),
  (7,'PEDRA RETANGULAR PARA AFIAR',NULL),
  (8,'DISCO DE CORTE (SE TIVER)',NULL),
  (9,'BROCAS (SE TIVER)',NULL),
  (10,'CONDIÇÃO DAS CHAVES',NULL),
  (11,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Serra Angular') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'FIXAÇÃO DA CAPA DE PROTEÇÃO DO DISCO',NULL),
  (2,'CHECAR DESGASTE EXCESSIVO OU DEFORMAÇÃO DO CORTE DO DISCO',NULL),
  (3,'VERIFICAR SE À TRINCAS NO DISCO/DENTES',NULL),
  (4,'OBSERVAR SE HÁ VIBRAÇÃO NO EIXO DO MOTOR.',NULL),
  (5,'VERIFICAR PORCA DE FIXAÇÃO DO DISCO NO EIXO DO MOTOR.',NULL),
  (6,'CABO ELÉTRICO EM BOM ESTADO, SEM EMENDAS',NULL),
  (7,'CHAVE LIGA / DESLIGA (GATILHO) = FUNCIONANDO',NULL),
  (8,'NORMA OPERACIONAL VISÍVEL NA ÁREA DE TRABALHO',NULL),
  (9,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Serra Circular Bancada') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A ÁREA DE CIRCULAÇÃO E OS ESPAÇOS AO ENTORNO ESTÃO LIVRES, ISOLADOS E SINALIZADOS?',NULL),
  (2,'A LIGAÇÃO DE ENERGIA ESTÁ SENDO REALIZADA POR INTERMÉDIO DE CONJUNTO PLUGUE E TOMADA?',NULL),
  (3,'AS CONEXÕES ESTÃO LIVRES DE RUPTURAS DE FIOS E SEM CABOS E/OU FIOS EXPOSTOS?',NULL),
  (4,'CABO COM DUPLO ISOLAMENTO, INSTALADO SUSPENSO, ESTICADO E NÃO ENROLADO, LIVRE DE EMENDAS, AVARIAS, DANOS E CONTATO COM ÁGUA?',NULL),
  (5,'CORREIA AJUSTADA E SEM DESGASTES OU FISSURAS?',NULL),
  (6,'DISCO PROTEGIDO POR COIFA EM BOM ESTADO DE USO, COM IDENTIFICAÇÃO DO FABRICANTE, LIVRE DE TRINCAS, RACHADURAS, DEFORMAÇÕES E DESGASTE EXCESSIVO E DEVIDAMENTE AJUSTADO AO EIXO?',NULL),
  (7,'EIXO SEM EMPENO OU AGARRAMENTOS E DEVIDAMENTE MONTADO SOBRE MANDRIL?',NULL),
  (8,'ESTÁ LIVRE DE VIBRAÇÕES E RUÍDOS ANORMAIS QUANDO EM FUNCIONAMENTO?',NULL),
  (9,'EXISTEM DISPOSITIVO EMPURRADOR, GUIA DE ALINHAMENTO, COLETOR DE SERRAGEM, INTERRUPTOR LIGA/DESLIGA E CUTELO DIVISOR DEVIDAMENTE AJUSTADO E COM IDENTIFICAÇÃO DO FABRICANTE?',NULL),
  (10,'EXISTE IDENTIFICAÇÃO DE TENSÃO NO EQUIPAMENTO E NO RAMAL/TOMADA DE ENERGIA?',NULL),
  (11,'EXISTE PROTEÇÃO NO SISTEMA DE TRANSMISSÃO DE FORÇA (CORREIAS, POLIAS ETC.)?',NULL),
  (12,'O EXTINTOR DE INCÊNDIO É PROPORCIONAL, INSPECIONADO E CARREGADO?',NULL),
  (13,'AS LÂMPADAS ESTÃO PROTEGIDAS CONTRA IMPACTOS?',NULL),
  (14,'A MESA ESTÁ ESTÁVEL, COM FECHAMENTO LATERAL E COBERTURA CONTRA QUEDA DE MATERIAIS E INTEMPÉRIES, EM BOM ESTADO DE CONSERVAÇÃO?',NULL),
  (15,'EXISTE SISTEMA DE CADEADO QUE IMPEÇA O ACIONAMENTO ACIDENTAL POR PESSOAS NÃO AUTORIZADAS?',NULL),
  (16,'EXISTE DISPOSITIVO PARA ACIONAMENTO DA PARADA DE EMERGÊNCIA?',NULL),
  (17,'A SERRA CIRCULAR ATENDE AOS ITENS EXIGIDOS NA NR-18.7?',NULL),
  (18,'ESTÁ EM CONFORMIDADE COM A NR-12?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Serra Marmore') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'Cabos flexíveis em boas condições?',NULL),
  (2,'Plug em boas condições?',NULL),
  (3,'Alças, presilha ou outro dispositivo de transporte do eletro portátil em bom estado ?',NULL),
  (4,'Botões de acionamento (liga/desliga) em bom estado?',NULL),
  (5,'Há indicação de voltagem no equipamento ?',NULL),
  (6,'Sem apresentar danos físicos ( carcaça amassada / quebrada) ?',NULL),
  (7,'Ferramenta utilizada para retirar disco,  acompanhando o equipamento?',NULL),
  (8,'Há evidências de que o equipamento é inspecionado diariamente?',NULL),
  (9,'O operador é autorizado a operar o equipamento?',NULL),
  (10,'Quando fora de uso o equipamento é armazenado em local seguro e adequado?',NULL),
  (11,'Odisco está em bom estado de concervação?',NULL),
  (12,'O disco utilizado é adequado para a atividade que está sendo realizada?',NULL),
  (13,'Condições gerais do equipamento?',NULL),
  (14,'O colabortador está utilizando os EPI''s adequadas a atividade?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Talha Manual') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O ESTADO DE CONSERVAÇÃO GERAL É SATISFATORIO',NULL),
  (2,'AS ENGRENAGENS FORAM INSPECIONADAS',NULL),
  (3,'FORAM VERIFICADOS OS DENTRES DAS ENGRENAGENS',NULL),
  (4,'EXISTE DESGASTE NAS ENGRENAGENS OU NOS DENTES',NULL),
  (5,'OS EIXOS FORAM INSPECIONADOS',NULL),
  (6,'EXISTEM SULCOS CAUSADOS PELO DESGASTE NOS EIXOS',NULL),
  (7,'OS ROSQUEAMENTOS FORAM INSPECIONADOS',NULL),
  (8,'FORAM TROCADAS AS ROSCAS DANIFICADAS',NULL),
  (9,'FOI INSPECIONADO O DISCO DE FREIO',NULL),
  (10,'INSPECIONAR O GANCHO DA TALHA',NULL),
  (11,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDA',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Trava Quedas Retratil') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'Inspecione para ver se há parafusos soltos e peças deformadas ou danifi cadas',NULL),
  (2,'Inspecione para ver se há distorção, trincas ou outros danos na caixa (A).',NULL),
  (3,'Se equipado, inspecione o olhal giratório (B) para checar se há distorções, trincas ou outros danos. O olhal giratório deve estar fixado de forma segura no trava-queda retrátil, mas deve girar livremente.',NULL),
  (4,'A linha de vida (C) deve ser estendida e retraída totalmente, sem hesitar nem criar uma situação de cabo frouxo.',NULL),
  (5,'Certifique-se de que o trava-queda retrátil trave quando a linha de vida é tracionada rapidamente. O travamento deve ser positivo, sem deslizamentos.',NULL),
  (6,'Todas as etiquetas devem estar presentes e totalmente visíveis (consulte "Etiquetagem").',NULL),
  (7,'Inspecione todo o trava-queda retrátil para checar se há sinais de corrosão.',NULL),
  (8,'Verificar sistema de queda se não esta violado?',NULL),
  (9,'Trava quedas possui dupla trava de segurança?',NULL),
  (10,'O número do CA está identificado com gravação visível?',NULL),
  (11,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Varredeira de Piso') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'Verificar bateria',NULL),
  (2,'Verificar comandos da máquina',NULL),
  (3,'Verificar funcionamento da buzina',NULL),
  (4,'Verificar funcionamento do sinal luminoso',NULL),
  (5,'Verificar funcionamento das escovas',NULL),
  (6,'Verificar funcionamento da luz frontal',NULL),
  (7,'Testar sistma de RÉ',NULL),
  (8,'Verificar condição do cilindro de GPL',NULL),
  (9,'Verificar nivel de óleo do motor e hidráulico',NULL),
  (10,'TODOS EPIs ESTÃO DISPONIVEIS PARA ATIVIDADE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist - Vibrador de concreto') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A LIGAÇÃO DE ENERGIA ESTÁ SENDO REALIZADA POR INTERMÉDIO DE CONJUNTO PLUGUE E TOMADA?',NULL),
  (2,'AS CONEXÕES ESTÃO LIVRES DE RUPTURAS DE FIOS E SEM CABOS E/OU FIOS EXPOSTOS?',NULL),
  (3,'AS LIGAÇÕES DE FASE, NEUTRO E TERRA, INCLUSIVE O ATERRAMENTO DA CARCAÇA, FORAM DEVIDAMENTE INSTALADAS POR ELETRICISTA?',NULL),
  (4,'O CABO POSSUI DUPLO ISOLAMENTO, ESTÁ INSTALADO SUSPENSO, ESTICADO E NÃO ENROLADO, LIVRE DE EMENDAS, AVARIAS, DANOS E CONTATO COM ÁGUA?',NULL),
  (5,'CARCAÇA, ALÇAS, MANOPLAS, PRESILHAS E OUTROS DISPOSITIVOS DE TRANSPORTE E MANOBRA DO EQUIPAMENTO PORTÁTIL ESTÃO LIVRES DE TRINCAS, AVARIAS OU DEFORMAÇÕES?',NULL),
  (6,'ESTÁ LIVRE DE VIBRAÇÕES E RUÍDOS ANORMAIS QUANDO EM FUNCIONAMENTO?',NULL),
  (7,'EXISTE IDENTIFICAÇÃO DE TENSÃO NO EQUIPAMENTO E NO RAMAL/TOMADA DE ENERGIA?',NULL),
  (8,'EXISTE INTERRUPTOR LIGA/DESLIGA FUNCIONANDO?',NULL),
  (9,'EXISTEM PROTEÇÕES MECÂNICAS CONTRA CONTATO ACIDENTAL COM PARTES MÓVEIS?',NULL),
  (10,'O FLANGE DE ACOPLAMENTO DO MANGOTE ENCONTRA-SE LIMPO?',NULL),
  (11,'O GATILHO DE ACIONAMENTO MANTÉM O EQUIPAMENTO EM FUNCIONAMENTO SOMENTE ENQUANTO ESTÁ PRESSIONADO?',NULL),
  (12,'O MANGOTE ENCONTRA-SE EM CONDIÇÕES DE USO?',NULL),
  (13,'O RAMAL DE ENERGIA POSSUI PROTEÇÃO POR DR OU DDR?',NULL),
  (14,'O SENTIDO DE ROTAÇÃO DO MOTOR ESTÁ CORRETO, CONFORME A INDICAÇÃO?',NULL),
  (15,'O PLUGUE E AS CONEXÕES SÃO DE PADRÃO INDUSTRIAL OU STECK, COM DISPOSITIVO DE SEGURANÇA CONTRA DESCONEXÃO ACIDENTAL E TAMPA DE PROTEÇÃO NA TOMADA?',NULL),
  (16,'QUANDO EXISTENTES, AS EMENDAS DOS CABOS E FIOS DE ENERGIA FORAM REALIZADAS COM FITA DE AUTOFUSÃO SOBREPOSTA POR FITA ISOLANTE, DE FORMA QUE SOMENTE SEJA POSSÍVEL REMOVÊ-LAS POR DESTRUIÇÃO?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist -Rolo Pneus') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A ALAVANCA SELETORA DE VELOCIDADE (FRENTE E RÉ) FUNCIONA?',NULL),
  (2,'A CAIXA DE LASTRO ESTÁ EM CONDIÇÕES DE USO?',NULL),
  (3,'A PLATAFORMA DE TRABALHO E A GRADE DE PROTEÇÃO ESTÃO EM CONDIÇÕES DE USO?',NULL),
  (4,'POSSUI ASSENTO FIXO COM CINTO DE SEGURANÇA DE TRÊS PONTOS?',NULL),
  (5,'BANDEIROLA E GIROFLEX ESTÃO FUNCIONANDO (CONDICIONAL)?',NULL),
  (6,'A BUZINA E A CHAVE GERAL PARA DESENERGIZAÇÃO DO SISTEMA ELÉTRICO ESTÃO FUNCIONANDO?',NULL),
  (7,'OS PNEUS ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (8,'O DISPOSITIVO DE ACIONAMENTO AUTOMÁTICO DOS FARÓIS, QUANDO DO ACIONAMENTO DA IGNIÇÃO, ESTÁ FUNCIONANDO?',NULL),
  (9,'OS ESPELHOS RETROVISORES (INTERNOS E EXTERNOS) PROPORCIONAM CONDIÇÕES DE VISIBILIDADE E ESTÃO LIVRES DE DANOS?',NULL),
  (10,'EXISTE PROTEÇÃO CONTRA INTEMPÉRIES?',NULL),
  (11,'O EXTINTOR DE INCÊNDIO É PROPORCIONAL AO VEÍCULO, ESTÁ INSPECIONADO E CARREGADO?',NULL),
  (12,'POSSUI FITAS REFLETIVAS NAS LATERAIS EXTERNAS?',NULL),
  (13,'O KIT DE EMERGÊNCIA ESTÁ COMPLETO, ARMAZENADO ADEQUADAMENTE E COM A LISTAGEM DOS ITENS?',NULL),
  (14,'OS ACELERADORES DE PÉ E MANUAL FUNCIONAM E ESTÃO EM CONDIÇÕES DE USO?',NULL),
  (15,'O SISTEMA HIDRÁULICO, AS CONEXÕES, AS MANGUEIRAS E OS PISTÕES APRESENTAM BOAS CONDIÇÕES, SEM VAZAMENTOS E COM CONEXÕES POR DISPOSITIVOS ESPECÍFICOS?',NULL),
  (16,'O VOLANTE E O PAINEL (INDICADORES E MEDIDORES) FUNCIONAM?',NULL),
  (17,'OS FREIOS DE ESTACIONAMENTO E DE SERVIÇO FUNCIONAM?',NULL),
  (18,'AS PARTES ROTATIVAS ESTÃO TOTALMENTE PROTEGIDAS?',NULL),
  (19,'POSSUI CALÇOS PARA O ESTACIONAMENTO DO VEÍCULO?',NULL),
  (20,'POSSUI RECIPIENTE PARA COLETA DE LIXO?',NULL),
  (21,'SETAS DIANTEIRAS E TRASEIRAS, LUZ DE FREIO, LUZ DE NEBLINA, ALARME E LUZ DE MARCHA À RÉ, PISCA-ALERTA E COMUTAÇÃO DOS FARÓIS ALTO/BAIXO ESTÃO FUNCIONANDO?',NULL),
  (22,'POSSUI PROTEÇÃO PARA O OPERADOR EM CASO DE CAPOTAMENTO E QUEDA DE MATERIAIS (“ROPS” E “FOPS”)?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Andaime') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A CAPACIDADE MÁXIMA DO ANDAIME ESTÁ LEGÍVEL?',NULL),
  (2,'AS PRANCHAS DO ANDAIME, QUANDO DE MADEIRA, ESTÃO ISENTAS DE NÓS?',NULL),
  (3,'O PISO DE TRABALHO DO ANDAIME POSSUI FORRAÇÃO COMPLETA, ANTIDERRAPANTE, NIVELADA, FIXADA OU TRAVADA DE MODO SEGURO E RESISTENTE?',NULL),
  (4,'AS PRANCHAS PREENCHem TOTALMENTE A ÁREA DA PLATAFORMA DE TRABALHO?',NULL),
  (5,'OS APOIOS DAS PRANCHAS NÃO SÃO INFERIORES A 10 CM E NÃO EXCEDEM 20 CM PARA FORA DO ANDAIME?',NULL),
  (6,'AS PEÇAS DO ANDAIME POSSUEM IDENTIFICAÇÃO DO FABRICANTE, REFERÊNCIA DO TIPO, LOTE E ANO DE FABRICAÇÃO?',NULL),
  (7,'O ANDAIME ESTÁ APRUMADO?',NULL),
  (8,'O ANDAIME ESTÁ MONTADO SOBRE PISO FIRME OU SAPATAS?',NULL),
  (9,'FOI PREVISTO APARELHO OU MECANISMO PARA A MOVIMENTAÇÃO VERTICAL E O IÇAMENTO DE MATERIAIS, SEM COMPROMETER A ESTABILIDADE DA ESTRUTURA DO ANDAIME?',NULL),
  (10,'O ANDAIME ESTÁ ANCORADO ADEQUADAMENTE EM PELO MENOS TRÊS PONTOS?',NULL),
  (11,'O ANDAIME POSSUI SISTEMA DE GUARDA-CORPO E RODAPÉ, INCLUSIVE NAS CABECEIRAS E EM TODO O SEU PERÍMETRO?',NULL),
  (12,'O GUARDA-CORPO POSSUI ALTURA MÍNIMA DE 1,20 M?',NULL),
  (13,'O ACESSO À PLATAFORMA DE TRABALHO DO ANDAIME É REALIZADO POR MEIO DE PORTÃO COM ABERTURA PARA O INTERIOR E DISPOSITIVO CONTRA ABERTURA ACIDENTAL?',NULL),
  (14,'O ANDAIME POSSUI MEIO DE ACESSO SEGURO (ESCADA)?',NULL),
  (15,'A ESTRUTURA DO ANDAIME APRESENTA ALGUM TIPO DE CORROSÃO?',NULL),
  (16,'O ANDAIME POSSUI TODOS OS ACESSÓRIOS DE SEGURANÇA (TRAVAS, SAPATAS ETC.)?',NULL),
  (17,'OS COLABORADORES PASSARAM POR AVALIAÇÃO MÉDICA FÍSICA E MENTAL PARA REALIZAR TRABALHOS EM ANDAIMES?',NULL),
  (18,'A REDE ELÉTRICA, A ÁGUA INDUSTRIAL OU A TUBULAÇÃO DE AR COMPRIMIDO FORAM DESLIGADAS OU INTERROMPIDAS PRÓXIMO AO LOCAL?',NULL),
  (19,'A ALTURA DO ANDAIME ESTÁ COMPATÍVEL COM AS DIMENSÕES DE SUA BASE?',NULL),
  (20,'A ÁREA SOB O ANDAIME ESTÁ ISOLADA CONTRA COLISÕES DE PESSOAS OU VEÍCULOS?',NULL),
  (21,'AS TRAVAS DE LIGAÇÃO E AS DIAGONAIS ESTÃO EM BOM ESTADO DE CONSERVAÇÃO?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Bate-Estaca') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A FIXAÇÃO DOS CABOS DE AÇO À ALAVANCA DE MOVIMENTAÇÃO DO EQUIPAMENTO É FEITA POR MEIO DE MANILHA?',NULL),
  (2,'AS CONDIÇÕES DO LOCAL DE INSTALAÇÃO (LAYOUT) SÃO SATISFATÓRIAS?',NULL),
  (3,'O ESTADO GERAL DE CONSERVAÇÃO DO EQUIPAMENTO (ESTRUTURA, ENCAIXES E CAPACETE) É SATISFATÓRIO?',NULL),
  (4,'EXISTE ALARME DE RÉ E ESTÁ FUNCIONANDO (MODELO SOBRE ESTEIRAS)?',NULL),
  (5,'EXISTE ATERRAMENTO ELÉTRICO?',NULL),
  (6,'EXISTE EXTINTOR DE INCÊNDIO NAS PROXIMIDADES?',NULL),
  (7,'EXISTEM PROTEÇÕES NAS PARTES MÓVEIS?',NULL),
  (8,'O TESTE HIDROSTÁTICO DO COMPRESSOR ESTÁ DENTRO DO PRAZO DE VALIDADE?',NULL),
  (9,'O OPERADOR É QUALIFICADO E POSSUI CRACHÁ?',NULL),
  (10,'O SISTEMA HIDRÁULICO (CONEXÕES, MANGUEIRAS, COMANDOS, VÁLVULAS, MANÔMETROS ETC.) ESTÁ FUNCIONANDO?',NULL),
  (11,'O TRAVA-QUEDAS FOI INSTALADO QUANDO NECESSÁRIO?',NULL),
  (12,'OS CABOS DE AÇO E OS ACESSÓRIOS ESTÃO EM BOAS CONDIÇÕES DE USO?',NULL),
  (13,'OS CABOS DE AÇO ESTÃO DIMENSIONADOS CONFORME A ESPECIFICAÇÃO (CARGA DE RUPTURA MÍNIMA DE CINCO VEZES A CARGA MÁXIMA DE TRABALHO E RESISTÊNCIA MÍNIMA À TRAÇÃO DE 160 KGF/MM²)?',NULL),
  (14,'OS CABOS DE IÇAMENTO DO MARTELO ESTÃO CONFORME A ESPECIFICAÇÃO (NO MÍNIMO SEIS VOLTAS NO TAMBOR)?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Compactador Sapo') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A ESTRUTURA DO EQUIPAMENTO ESTÁ EM BOM ESTADO?',NULL),
  (2,'A CARCAÇA DO EQUIPAMENTO ESTÁ EM BOM ESTADO?',NULL),
  (3,'A MANGUEIRA DO EQUIPAMENTO ESTÁ EM BOM ESTADO?',NULL),
  (4,'O TANQUE DE COMBUSTÍVEL ESTÁ EM BOM ESTADO?',NULL),
  (5,'O TANQUE DE COMBUSTÍVEL ESTÁ LIVRE DE VAZAMENTOS?',NULL),
  (6,'AS HÉLICES DO SISTEMA DE ALISAMENTO ESTÃO EM BOM ESTADO?',NULL),
  (7,'AS CORREIAS DO MOTOR ESTÃO EM BOM ESTADO E SEM AVARIAS?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Equipamento de Solda') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A MANGUEIRA DE GÁS ESTÁ LIVRE DE NÓS OU DOBRAS?',NULL),
  (2,'AS MANGUEIRAS ESTÃO PROTEGIDAS CONTRA CENTELHAS, IMPACTOS E CANTOS VIVOS?',NULL),
  (3,'AS MANGUEIRAS POSSUEM IDENTIFICAÇÃO VISÍVEL DO TIPO DE GÁS TRANSPORTADO?',NULL),
  (4,'AS MANGUEIRAS ESTÃO DENTRO DAS ESPECIFICAÇÕES DO FABRICANTE E SÃO COMPATÍVEIS COM A SOLDA A SER EXECUTADA?',NULL),
  (5,'AS MANGUEIRAS ESTÃO LIVRES DE EMENDAS?',NULL),
  (6,'AS TOCHAS ESTÃO SEM FUROS E EM BOAS CONDIÇÕES DE USO?',NULL),
  (7,'A CHAVE UTILIZADA PARA ABRIR A VÁLVULA DO CILINDRO ESTÁ JUNTO AO EQUIPAMENTO?',NULL),
  (8,'EXISTE VÁLVULA CONTRA RETROCESSO DE CHAMA?',NULL),
  (9,'AS VÁLVULAS, OS REGULADORES E OS MANÔMETROS ESTÃO EM BOAS CONDIÇÕES DE USO?',NULL),
  (10,'OS CILINDROS ESTÃO EM BOAS CONDIÇÕES DE USO E LIVRES DE AVARIAS?',NULL),
  (11,'OS COMPONENTES ESTÃO LIMPOS E LIVRES DE ÓLEOS E GRAXAS?',NULL),
  (12,'OS CILINDROS POSSUEM TAMPAS PROTETORAS PARA MOVIMENTAÇÃO?',NULL),
  (13,'OS CILINDROS ESTÃO POSICIONADOS VERTICALMENTE E DEVIDAMENTE FIXADOS POR CORRENTES?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Escada Movel') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A ESCADA ESTÁ APOIADA SOBRE PAVIMENTO ESTÁVEL, PLANO E HORIZONTAL?',NULL),
  (2,'A ESCADA POSSUI SAPATAS ANTIDERRAPANTES?',NULL),
  (3,'A ESCADA ESTÁ ISENTA DE TRINCAS, RACHADURAS, FARPAS, SALIÊNCIAS E OUTROS DEFEITOS?',NULL),
  (4,'A ESCADA POSSUI ESTRUTURAS INTEIRIÇAS E SEM EMENDAS?',NULL),
  (5,'A ESCADA POSSUI TODOS OS DEGRAUS?',NULL),
  (6,'OS DEGRAUS ESTÃO FIXOS, LIMPOS E SÃO UNIFORMES?',NULL),
  (7,'A ESCADA POSSUI LIMITADOR DE ABERTURA?',NULL),
  (8,'A ESCADA ESTÁ FIXADA NA EXTREMIDADE SUPERIOR?',NULL),
  (9,'O SERVIÇO A SER EXECUTADO ENVOLVE ELETRICIDADE? EM CASO POSITIVO, A ESCADA É DE MATERIAL NÃO CONDUTOR?',NULL),
  (10,'A ESCADA ESTÁ POSICIONADA A UMA DISTÂNCIA SEGURA DE BARRAMENTOS ELÉTRICOS?',NULL),
  (11,'O CINTO DE SEGURANÇA FOI INSPECIONADO?',NULL),
  (12,'A ÁREA DESTINADA À ATIVIDADE FOI SINALIZADA E ISOLADA?',NULL),
  (13,'EXISTE LOCAL ADEQUADO PARA FIXAÇÃO DO CINTO DE SEGURANÇA?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Escada-Marinheiro') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A ESCADA COM MAIS DE 6 METROS POSSUI LINHA DE VIDA EM TODA A SUA EXTENSÃO?',NULL),
  (2,'O TALABARTE DUPLO ESTÁ DISPONÍVEL PARA USO?',NULL),
  (3,'A DISTÂNCIA ENTRE OS DEGRAUS E A ESTRUTURA DE FIXAÇÃO É ADEQUADA E PERMITE A MOVIMENTAÇÃO DO COLABORADOR?',NULL),
  (4,'QUANDO POSSUI MAIS DE 9 METROS, A ESCADA DISPÕE DE PATAMAR INTERMEDIÁRIO PROTEGIDO COM GUARDA-CORPO E RODAPÉ?',NULL),
  (5,'QUANDO POSSUI MAIS DE 6 METROS, A ESCADA DISPÕE DE GAIOLA PROTETORA A PARTIR DE 2 METROS ACIMA DA BASE E ATÉ 1 METRO ACIMA DA ÚLTIMA SUPERFÍCIE DE TRABALHO?',NULL),
  (6,'O INTERIOR DA GAIOLA ESTÁ ISENTO DE FIOS, TUBULAÇÕES E OUTROS ITENS QUE POSSAM OFERECER RISCOS?',NULL),
  (7,'HÁ NECESSIDADE DE TRANSPORTAR CARGAS POR IÇAMENTO? EM CASO POSITIVO, A OPERAÇÃO ESTÁ DE ACORDO COM O PROCEDIMENTO APLICÁVEL?',NULL),
  (8,'A ESCADA ESTÁ FIXADA NO TOPO E NA BASE?',NULL),
  (9,'A ÁREA DESTINADA À ATIVIDADE FOI SINALIZADA E ISOLADA?',NULL),
  (10,'EXISTE LOCAL ADEQUADO PARA FIXAÇÃO DO CINTO DE SEGURANÇA?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Esmerilhadeira_Lixadeira') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'OS BOTÕES DE ACIONAMENTO (LIGA/DESLIGA, SEGURANÇA E TRAVA DO EIXO) ESTÃO EM BOM ESTADO?',NULL),
  (2,'AS ALÇAS PARA TRANSPORTE E O PUNHO AUXILIAR ESTÃO EM BOM ESTADO?',NULL),
  (3,'A CAIXA DE ENGRENAGENS ESTÁ EM BOAS CONDIÇÕES DE USO?',NULL),
  (4,'O DISCO POSSUI CAPA DE PROTEÇÃO?',NULL),
  (5,'OS FLANGES INTERNO E EXTERNO ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (6,'O DISCO DE CORTE OU DESBASTE ESTÁ BEM FIXADO E EM BOAS CONDIÇÕES DE USO?',NULL),
  (7,'AS CHAVES DE APERTO PARA FIXAÇÃO DO DISCO ACOMPANHAM O EQUIPAMENTO?',NULL),
  (8,'A ROTAÇÃO MÁXIMA DO DISCO É COMPATÍVEL COM A ROTAÇÃO DO EQUIPAMENTO?',NULL),
  (9,'OS CABOS FLEXÍVEIS ESTÃO EM BOAS CONDIÇÕES DE USO?',NULL),
  (10,'OS CONECTORES ESTÃO FIRMES E EM BOM ESTADO?',NULL),
  (11,'EXISTE INDICAÇÃO DA TENSÃO ELÉTRICA NO EQUIPAMENTO?',NULL),
  (12,'O EQUIPAMENTO ESTÁ SEM AVARIAS, PARTES QUEBRADAS OU AMASSADAS?',NULL),
  (13,'O EQUIPAMENTO ESTÁ LIMPO E LIVRE DE ÓLEOS E GRAXAS?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Inspeção de máquinas empilhadeiras e similares') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O EXTINTOR ESTÁ DISPONÍVEL, INSPECIONADO E DENTRO DA VALIDADE?',NULL),
  (2,'A TRAVA DA BATERIA ESTÁ EM BOAS CONDIÇÕES?',NULL),
  (3,'AS MANGUEIRAS HIDRÁULICAS ESTÃO EM BOAS CONDIÇÕES E SEM VAZAMENTOS?',NULL),
  (4,'O NÍVEL DO ÓLEO HIDRÁULICO ESTÁ ADEQUADO?',NULL),
  (5,'OS ROLAMENTOS DA TORRE ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (6,'O NÍVEL DO ELETRÓLITO DA BATERIA ESTÁ ADEQUADO?',NULL),
  (7,'A EMPILHADEIRA ESTÁ LIMPA E ORGANIZADA?',NULL),
  (8,'O NÚMERO DE IDENTIFICAÇÃO DA BATERIA ESTÁ VISÍVEL?',NULL),
  (9,'O CARREGADOR, OS CABOS E OS CONECTORES DA EMPILHADEIRA ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (10,'O SUPORTE DA BATERIA E A ÁREA DE BATERIAS ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (11,'O INDICADOR DA BATERIA E O HORÍMETRO ESTÃO FUNCIONANDO?',NULL),
  (12,'A CHAVE GERAL ESTÁ FUNCIONANDO?',NULL),
  (13,'AS FUNÇÕES HIDRÁULICAS E AS ALAVANCAS DE COMANDO ESTÃO FUNCIONANDO?',NULL),
  (14,'OS RETROVISORES ESTÃO EM BOAS CONDIÇÕES E PROPORCIONAM VISIBILIDADE ADEQUADA?',NULL),
  (15,'A CHAVE DE CONTATO ESTÁ FUNCIONANDO?',NULL),
  (16,'OS BOTÕES DE ACIONAMENTO ESTÃO FUNCIONANDO?',NULL),
  (17,'OS GARFOS E AS TRAVAS ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (18,'A GRADE DE PROTEÇÃO ESTÁ EM BOAS CONDIÇÕES?',NULL),
  (19,'AS CORRENTES ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (20,'A PINTURA E O ASPECTO VISUAL DA EMPILHADEIRA ESTÃO SATISFATÓRIOS?',NULL),
  (21,'O HORÁRIO DA TROCA DA BATERIA FOI REGISTRADO?',NULL),
  (22,'O NÍVEL DO ÓLEO DO MOTOR ESTÁ ADEQUADO?',NULL),
  (23,'O NÍVEL DO LÍQUIDO DE ARREFECIMENTO DO RADIADOR ESTÁ ADEQUADO?',NULL),
  (24,'A INDICAÇÃO DA CAPACIDADE MÁXIMA DE CARGA ESTÁ LEGÍVEL E EM LOCAL VISÍVEL?',NULL),
  (25,'O CILINDRO DE GLP ESTÁ EM BOAS CONDIÇÕES E DEVIDAMENTE FIXADO?',NULL),
  (26,'A BUZINA ESTÁ FUNCIONANDO?',NULL),
  (27,'OS DISPOSITIVOS BLUE SPOT E RED ZONE ESTÃO FUNCIONANDO?',NULL),
  (28,'O FREIO DE ESTACIONAMENTO ESTÁ FUNCIONANDO?',NULL),
  (29,'O BANCO E O CINTO DE SEGURANÇA ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (30,'O GIROFLEX E O FAROL ESTÃO FUNCIONANDO?',NULL),
  (31,'O SISTEMA DE DIREÇÃO E O TIMÃO ESTÃO FUNCIONANDO?',NULL),
  (32,'A EMPILHADEIRA ESTÁ LIVRE DE VAZAMENTOS?',NULL),
  (33,'OS PNEUS E AS RODAS ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (34,'O SISTEMA DE ILUMINAÇÃO ESTÁ FUNCIONANDO?',NULL),
  (35,'O ALARME DE RÉ ESTÁ FUNCIONANDO?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Inspeção diaria de ponte rolante_Portico') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A BOTOEIRA ESTÁ EM PERFEITO ESTADO DE CONSERVAÇÃO?',NULL),
  (2,'A BOTOEIRA POSSUI IDENTIFICAÇÃO DAS FUNÇÕES?',NULL),
  (3,'O BOTÃO DE EMERGÊNCIA ESTÁ FUNCIONANDO CORRETAMENTE, IMPEDINDO OS DEMAIS COMANDOS ENQUANTO ESTIVER ACIONADO?',NULL),
  (4,'OS MOVIMENTOS DE TRANSLAÇÃO E ELEVAÇÃO POSSUEM LIMITADORES DE CURSO?',NULL),
  (5,'O SISTEMA DE FREIO ESTÁ FUNCIONANDO?',NULL),
  (6,'AS CORRENTES ESTÃO EM BOAS CONDIÇÕES, SEM ELOS AMASSADOS OU ALONGADOS?',NULL),
  (7,'A SIRENE ESTÁ FUNCIONANDO?',NULL),
  (8,'O GIROFLEX ESTÁ FUNCIONANDO?',NULL),
  (9,'O DISPOSITIVO DE IÇAMENTO ESTÁ EM BOAS CONDIÇÕES E LIVRE DE RACHADURAS OU FISSURAS?',NULL),
  (10,'OS GANCHOS ESTÃO EM BOAS CONDIÇÕES E LIVRES DE RACHADURAS OU FISSURAS?',NULL),
  (11,'OS TRILHOS ESTÃO DESOBSTRUÍDOS?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Inspeção geral SSMA') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'(ORDEM E LIMPEZA) A ILUMINAÇÃO É ADEQUADA ÀS TAREFAS EXECUTADAS?',NULL),
  (2,'(ORDEM E LIMPEZA) AS INSTALAÇÕES PREDIAIS, INCLUINDO PISOS, PAREDES, TETOS E FECHAMENTOS, ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (3,'(ORDEM E LIMPEZA) OS RECIPIENTES SÃO ESVAZIADOS DIARIAMENTE OU SEMPRE QUE NECESSÁRIO?',NULL),
  (4,'(ORDEM E LIMPEZA) A LIMPEZA É REALIZADA REGULARMENTE?',NULL),
  (5,'(ORDEM E LIMPEZA) AS ÁREAS DE CIRCULAÇÃO ESTÃO DESOBSTRUÍDAS?',NULL),
  (6,'(ORDEM E LIMPEZA) AS ÁREAS DE CIRCULAÇÃO ESTÃO DEMARCADAS NO PISO?',NULL),
  (7,'(ORDEM E LIMPEZA) A ÁREA DE TRABALHO ESTÁ LIVRE DE RISCOS DE ESCORREGÕES, TROPEÇOS OU QUEDAS?',NULL),
  (8,'(ORDEM E LIMPEZA) OS MATERIAIS EM ESTOQUE ESTÃO ARMAZENADOS CORRETAMENTE?',NULL),
  (9,'(ORDEM E LIMPEZA) AS SUPERFÍCIES DE TRABALHO ESTÃO SECAS OU POSSUEM CARACTERÍSTICAS ANTIDERRAPANTES?',NULL),
  (10,'(ORDEM E LIMPEZA) OUTROS:',NULL),
  (11,'(PREVENÇÃO E COMBATE A INCÊNDIO) TODOS OS EQUIPAMENTOS DE COMBATE A INCÊNDIO ESTÃO DEVIDAMENTE IDENTIFICADOS?',NULL),
  (12,'(PREVENÇÃO E COMBATE A INCÊNDIO) TODOS OS EXTINTORES ESTÃO DENTRO DOS PRAZOS DE VALIDADE DA CARGA E DO TESTE HIDROSTÁTICO?',NULL),
  (13,'(PREVENÇÃO E COMBATE A INCÊNDIO) OS HIDRANTES E EXTINTORES ESTÃO DESOBSTRUÍDOS?',NULL),
  (14,'(PREVENÇÃO E COMBATE A INCÊNDIO) OS EQUIPAMENTOS DE COMBATE A INCÊNDIO ESTÃO LIVRES DE DANOS E EM CONDIÇÕES DE USO?',NULL),
  (15,'(PREVENÇÃO E COMBATE A INCÊNDIO) HÁ BRIGADISTA TRABALHANDO NO SETOR?',NULL),
  (16,'(PREVENÇÃO E COMBATE A INCÊNDIO) AS MACAS DE EMERGÊNCIA ESTÃO EM BOAS CONDIÇÕES E SÃO DE FÁCIL ACESSO?',NULL),
  (17,'(PREVENÇÃO E COMBATE A INCÊNDIO) EXISTEM ALARMES DE INCÊNDIO NO LOCAL?',NULL),
  (18,'(PREVENÇÃO E COMBATE A INCÊNDIO) EXISTEM LUZES DE EMERGÊNCIA NO LOCAL?',NULL),
  (19,'(PREVENÇÃO E COMBATE A INCÊNDIO) OUTROS:',NULL),
  (20,'(MÁQUINAS E FERRAMENTAS) AS MÁQUINAS POSSUEM PROTEÇÕES MÓVEIS?',NULL),
  (21,'(MÁQUINAS E FERRAMENTAS) AS MÁQUINAS POSSUEM PROTEÇÕES FIXAS?',NULL),
  (22,'(MÁQUINAS E FERRAMENTAS) AS FERRAMENTAS ESTÃO EM BOM ESTADO DE CONSERVAÇÃO?',NULL),
  (23,'(MÁQUINAS E FERRAMENTAS) OS DISPOSITIVOS DE SEGURANÇA ESTÃO FUNCIONANDO CORRETAMENTE?',NULL),
  (24,'(MÁQUINAS E FERRAMENTAS) OS COLABORADORES POSSUEM CAPACITAÇÃO APLICÁVEL CONFORME A NR-12?',NULL),
  (25,'(MÁQUINAS E FERRAMENTAS) EXISTEM IMPROVISAÇÕES NA UTILIZAÇÃO DAS FERRAMENTAS?',NULL),
  (26,'(MÁQUINAS E FERRAMENTAS) OS COLABORADORES ESTÃO UTILIZANDO OS EPIS PREVISTOS NO PGR?',NULL),
  (27,'(MÁQUINAS E FERRAMENTAS) EXISTEM INSTRUÇÕES DE TRABALHO PARA OPERAÇÃO, LIMPEZA E MANUTENÇÃO?',NULL),
  (28,'(MÁQUINAS E FERRAMENTAS) OUTROS:',NULL),
  (29,'(INSTALAÇÕES ELÉTRICAS) EXISTEM FIAÇÕES EXPOSTAS NO SETOR?',NULL),
  (30,'(INSTALAÇÕES ELÉTRICAS) AS INSTALAÇÕES PERMANENTES ESTÃO LIVRES DE CABOS OU FIAÇÕES ELÉTRICAS TEMPORÁRIAS?',NULL),
  (31,'(INSTALAÇÕES ELÉTRICAS) OS CABOS E FIOS DE EXTENSÕES TEMPORÁRIAS ESTÃO ORGANIZADOS E NÃO OFERECEM RISCO DE TROPEÇO?',NULL),
  (32,'(INSTALAÇÕES ELÉTRICAS) TODAS AS MÁQUINAS E OS EQUIPAMENTOS ESTÃO DEVIDAMENTE ATERRADOS?',NULL),
  (33,'(INSTALAÇÕES ELÉTRICAS) AS TOMADAS, OS EQUIPAMENTOS E OS PAINÉIS ELÉTRICOS ESTÃO SINALIZADOS?',NULL),
  (34,'(INSTALAÇÕES ELÉTRICAS) AS TOMADAS, OS FIOS E AS EXTENSÕES ESTÃO SEM REMENDOS E EM BOAS CONDIÇÕES?',NULL),
  (35,'(INSTALAÇÕES ELÉTRICAS) TODOS OS PAINÉIS DA ÁREA ESTÃO TRANCADOS E SINALIZADOS?',NULL),
  (36,'(INSTALAÇÕES ELÉTRICAS) OUTROS:',NULL),
  (37,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) OS CARRINHOS MANUAIS ESTÃO EM BOAS CONDIÇÕES E POSSUEM INDICAÇÃO DA CAPACIDADE DE CARGA?',NULL),
  (38,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) EXISTE CRONOGRAMA DE MANUTENÇÃO PARA OS EQUIPAMENTOS MOTORIZADOS E DEMAIS EQUIPAMENTOS DE TRANSPORTE?',NULL),
  (39,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) OS EQUIPAMENTOS ESTÃO LIVRES DE VAZAMENTOS DE COMBUSTÍVEL, ÓLEO OU ÁGUA?',NULL),
  (40,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) AS LUZES, OS FREIOS E AS BUZINAS FUNCIONAM CORRETAMENTE?',NULL),
  (41,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) OS PNEUS ESTÃO EM BOM ESTADO?',NULL),
  (42,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) OS COLABORADORES POSSUEM CAPACITAÇÃO APLICÁVEL CONFORME A NR-11?',NULL),
  (43,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) EXISTEM REGISTROS DAS MANUTENÇÕES INTERNAS OU EXTERNAS?',NULL),
  (44,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) O CHECKLIST ESTÁ SENDO PREENCHIDO CORRETAMENTE?',NULL),
  (45,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) AS NÃO CONFORMIDADES REGISTRADAS PELOS OPERADORES NOS CHECKLISTS ESTÃO SENDO TRATADAS?',NULL),
  (46,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) OS OPERADORES CAPACITADOS CONFORME A NR-11 POSSUEM IDENTIFICAÇÃO?',NULL),
  (47,'(EQUIPAMENTOS COM FORÇA MOTRIZ PRÓPRIA E OUTROS) OUTROS:',NULL),
  (48,'(EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL E COLETIVA) OS COLABORADORES ESTÃO UTILIZANDO OS EPIS ADEQUADAMENTE?',NULL),
  (49,'(EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL E COLETIVA) OS EPIS ESTÃO EM BOM ESTADO DE CONSERVAÇÃO?',NULL),
  (50,'(EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL E COLETIVA) OS COLABORADORES FORAM ORIENTADOS SOBRE A IMPORTÂNCIA DO USO DOS EPIS?',NULL),
  (51,'(EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL E COLETIVA) OS EPIS UTILIZADOS ESTÃO LIMPOS E EM BOAS CONDIÇÕES?',NULL),
  (52,'(EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL E COLETIVA) A ENTREGA DOS EPIS ESTÁ REGISTRADA NA FICHA INDIVIDUAL DO COLABORADOR?',NULL),
  (53,'(EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL E COLETIVA) OS PRAZOS DE SUBSTITUIÇÃO DOS EPIS ESTÃO SENDO RESPEITADOS?',NULL),
  (54,'(EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL E COLETIVA) OS EPIS POSSUEM CERTIFICADOS DE APROVAÇÃO VÁLIDOS?',NULL),
  (55,'(EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL E COLETIVA) A HOMOLOGAÇÃO DE NOVOS EPIS ESTÁ SENDO REALIZADA E POSSUI EVIDÊNCIAS?',NULL),
  (56,'(EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL E COLETIVA) OUTROS:',NULL),
  (57,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) OS INFLAMÁVEIS E PRODUTOS QUÍMICOS ESTÃO ARMAZENADOS EM LOCAL APROPRIADO?',NULL),
  (58,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) OS RECIPIENTES UTILIZADOS SÃO ADEQUADOS?',NULL),
  (59,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) O INVENTÁRIO DE PRODUTOS QUÍMICOS ESTÁ ATUALIZADO E DISPONÍVEL?',NULL),
  (60,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) AS FDS ESTÃO DISPONÍVEIS NO LOCAL DE TRABALHO?',NULL),
  (61,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) OS COLABORADORES FORAM CAPACITADOS PARA CONSULTAR E UTILIZAR AS INFORMAÇÕES DAS FDS?',NULL),
  (62,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) OS RECIPIENTES ESTÃO SINALIZADOS E IDENTIFICADOS CORRETAMENTE?',NULL),
  (63,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) EXISTEM PRODUTOS VENCIDOS NA ÁREA?',NULL),
  (64,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) EXISTEM CHUVEIRO DE EMERGÊNCIA E/OU LAVA-OLHOS NO LOCAL?',NULL),
  (65,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) OS COLABORADORES ESTÃO UTILIZANDO OS EPIS PREVISTOS NAS FDS?',NULL),
  (66,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) OS ARMÁRIOS CORTA-FOGO ESTÃO ATERRADOS?',NULL),
  (67,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) OS COLABORADORES RECEBERAM A CAPACITAÇÃO APLICÁVEL CONFORME A NR-20?',NULL),
  (68,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) É UTILIZADA UMA TABELA DE COMPATIBILIDADE QUÍMICA PARA O ARMAZENAMENTO DOS PRODUTOS?',NULL),
  (69,'(INFLAMÁVEIS E PRODUTOS QUÍMICOS) OUTROS:',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Linha de Vida') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'EXISTE DOCUMENTAÇÃO DA LINHA DE VIDA, INCLUINDO PROJETO, MEMORIAL DE CÁLCULO E ART?',NULL),
  (2,'A LINHA DE VIDA FOI INSTALADA DE ACORDO COM O PROJETO?',NULL),
  (3,'A LINHA DE VIDA POSSUI TAG DE IDENTIFICAÇÃO?',NULL),
  (4,'O LIMITE DE CARGA ESPECIFICADO NO PROJETO ESTÁ SENDO RESPEITADO?',NULL),
  (5,'AS CONDIÇÕES GERAIS DA LINHA DE VIDA SÃO SATISFATÓRIAS?',NULL),
  (6,'OS DISPOSITIVOS DE ANCORAGEM DA LINHA DE VIDA ESTÃO DEVIDAMENTE FIXADOS E APERTADOS?',NULL),
  (7,'A LINHA DE VIDA ESTÁ LIVRE DE CORROSÃO, AVARIAS E NÃO CONFORMIDADES QUE POSSAM COMPROMETER SUA SEGURANÇA?',NULL),
  (8,'OS COMPONENTES E DISPOSITIVOS DE ANCORAGEM, INCLUINDO TROLE, ELEMENTOS SOLDADOS, PILARES DE SUPORTE, ESTICADORES E CABOS, ESTÃO LIVRES DE DEFORMAÇÕES?',NULL),
  (9,'EXISTE INDICAÇÃO VISÍVEL DO NÚMERO MÁXIMO DE TRABALHADORES QUE PODEM PERMANECER CONECTADOS SIMULTANEAMENTE?',NULL),
  (10,'A ÁREA ONDE O TRABALHO SERÁ REALIZADO ESTÁ ISOLADA E SINALIZADA?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Maquina de Solda') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A ÁREA DE CIRCULAÇÃO E OS ESPAÇOS AO ENTORNO ESTÃO LIVRES?',NULL),
  (2,'A LIGAÇÃO DE ENERGIA É REALIZADA POR MEIO DE CONJUNTO PLUGUE E TOMADA?',NULL),
  (3,'A MANIVELA E OS MEDIDORES DE CORRENTE E TENSÃO ESTÃO FUNCIONANDO E LEGÍVEIS?',NULL),
  (4,'A PEÇA A SER SOLDADA ESTÁ CONECTADA POR PINÇA OU ALICATE APROPRIADO E EM BOM ESTADO?',NULL),
  (5,'AS ALAVANCAS E OS PEDAIS ESTÃO CONSERVADOS E FUNCIONANDO?',NULL),
  (6,'AS CONEXÕES ESTÃO SEM FIOS ROMPIDOS, CABOS DANIFICADOS OU CONDUTORES EXPOSTOS?',NULL),
  (7,'AS LIGAÇÕES DE FASE, NEUTRO E TERRA, INCLUINDO O ATERRAMENTO DA CARCAÇA, FORAM INSTALADAS POR PROFISSIONAL AUTORIZADO?',NULL),
  (8,'O CABO POSSUI DUPLO ISOLAMENTO, ESTÁ SUSPENSO, DESENROLADO E LIVRE DE EMENDAS, AVARIAS, DANOS E CONTATO COM ÁGUA?',NULL),
  (9,'A CARCAÇA, AS ALÇAS, AS MANOPLAS, AS PRESILHAS E OS DEMAIS DISPOSITIVOS DE TRANSPORTE ESTÃO LIVRES DE TRINCAS, AVARIAS OU DEFORMAÇÕES?',NULL),
  (10,'O EQUIPAMENTO ESTÁ INSTALADO EM ÁREA ISOLADA E SINALIZADA?',NULL),
  (11,'O EQUIPAMENTO ESTÁ LIVRE DE VIBRAÇÕES E RUÍDOS ANORMAIS DURANTE O FUNCIONAMENTO?',NULL),
  (12,'EXISTE IDENTIFICAÇÃO DA TENSÃO NO EQUIPAMENTO E NO RAMAL OU TOMADA DE ENERGIA?',NULL),
  (13,'O INTERRUPTOR LIGA/DESLIGA ESTÁ FUNCIONANDO?',NULL),
  (14,'EXISTE PROGRAMA DE MANUTENÇÃO PREVENTIVA?',NULL),
  (15,'EXISTEM PLACAS DE SEGURANÇA, SINALIZAÇÃO DOS EPIS OBRIGATÓRIOS E IDENTIFICAÇÃO DO OPERADOR?',NULL),
  (16,'EXISTEM PROTEÇÕES MECÂNICAS CONTRA CONTATO ACIDENTAL COM PARTES MÓVEIS, PONTOS DE PRENSAMENTO E DEMAIS COMPONENTES QUE OFEREÇAM RISCO?',NULL),
  (17,'O EXTINTOR DE INCÊNDIO É ADEQUADO, ESTÁ INSPECIONADO E CARREGADO?',NULL),
  (18,'O LOCAL ESTÁ LIMPO E SEM MATERIAIS COMBUSTÍVEIS NAS PROXIMIDADES?',NULL),
  (19,'O LOCAL POSSUI ILUMINAÇÃO ADEQUADA PARA A EXECUÇÃO DO SERVIÇO?',NULL),
  (20,'O RAMAL DE ENERGIA POSSUI PROTEÇÃO POR DISPOSITIVO DIFERENCIAL RESIDUAL?',NULL),
  (21,'OS CABOS CONDUTORES, AS PINÇAS E OS ALICATES SÃO MANTIDOS LONGE DE ÓLEO, GRAXA E UMIDADE E APOIADOS SOBRE SUPERFÍCIES ISOLANTES?',NULL),
  (22,'OS TERMINAIS ELÉTRICOS E ALICATES ESTÃO EM BOM ESTADO?',NULL),
  (23,'O PLUGUE E AS CONEXÕES SÃO DE PADRÃO INDUSTRIAL, COM PROTEÇÃO CONTRA DESCONEXÃO ACIDENTAL E TAMPA NA TOMADA?',NULL),
  (24,'O PORTA-ELETRODO POSSUI CAPA DE PROTEÇÃO ÍNTEGRA?',NULL),
  (25,'POSSUI BIOMBO DE PROTEÇÃO CONFECCIONADO COM MATERIAL RESISTENTE AO FOGO?',NULL),
  (26,'POSSUI DISPOSITIVO DE PARADA DE EMERGÊNCIA?',NULL),
  (27,'POSSUI NO MÍNIMO TRÊS PONTOS DE APOIO E PNEUS EM BOM ESTADO?',NULL),
  (28,'POSSUI PROTEÇÃO CONTRA INTEMPÉRIES E FITAS REFLETIVAS NAS LATERAIS EXTERNAS?',NULL),
  (29,'QUANDO EXISTEM, AS EMENDAS DOS CABOS E FIOS FORAM EXECUTADAS POR PROFISSIONAL AUTORIZADO, COM ISOLAMENTO ADEQUADO E CONFORME O PROCEDIMENTO APLICÁVEL?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Mini-Rolo Compressor') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O BOTÃO DE PARADA DE EMERGÊNCIA ESTÁ FUNCIONANDO?',NULL),
  (2,'A BUZINA E A CHAVE GERAL PARA DESENERGIZAÇÃO DO SISTEMA ELÉTRICO ESTÃO FUNCIONANDO?',NULL),
  (3,'O DISPOSITIVO DE PARADA AUTOMÁTICA POR APROXIMAÇÃO AO ROLO ESTÁ FUNCIONANDO?',NULL),
  (4,'EXISTEM SINALIZAÇÃO DE PERIGO DE ESMAGAMENTO E FITAS REFLETIVAS NAS LATERAIS EXTERNAS?',NULL),
  (5,'O EXTINTOR DE INCÊNDIO É ADEQUADO AO EQUIPAMENTO, ESTÁ INSPECIONADO E CARREGADO?',NULL),
  (6,'O CONTROLE REMOTO ESTÁ EM BOAS CONDIÇÕES E POSSUI INSTRUÇÕES VISÍVEIS?',NULL),
  (7,'EXISTE LOCAL ADEQUADO PARA GUARDAR O CONTROLE REMOTO E CARREGAR SUA BATERIA?',NULL),
  (8,'O SISTEMA HIDRÁULICO, AS CONEXÕES, AS MANGUEIRAS E OS PISTÕES ESTÃO EM BOAS CONDIÇÕES E LIVRES DE VAZAMENTOS?',NULL),
  (9,'AS LUZES E OS FARÓIS ESTÃO FUNCIONANDO NORMALMENTE?',NULL),
  (10,'O EQUIPAMENTO APRESENTA BOAS CONDIÇÕES VISUAIS?',NULL),
  (11,'A IDENTIFICAÇÃO DA COR DO MÊS ESTÁ ATUALIZADA E VISÍVEL?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Munk') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O VEÍCULO ESTÁ LIVRE DE VAZAMENTOS?',NULL),
  (2,'O NÍVEL DO ÓLEO DO MOTOR ESTÁ ADEQUADO?',NULL),
  (3,'O NÍVEL DO ÓLEO HIDRÁULICO ESTÁ ADEQUADO?',NULL),
  (4,'O NÍVEL DO ÓLEO DA TRANSMISSÃO ESTÁ ADEQUADO?',NULL),
  (5,'A CORREIA DO ALTERNADOR ESTÁ LIVRE DE ANOMALIAS?',NULL),
  (6,'OS FILTROS DE AR INTERNO E EXTERNO ESTÃO EM CONDIÇÕES NORMAIS DE FUNCIONAMENTO?',NULL),
  (7,'O NÍVEL DO LÍQUIDO DE ARREFECIMENTO DO RADIADOR ESTÁ ADEQUADO E O RESERVATÓRIO POSSUI TAMPA?',NULL),
  (8,'O OPERADOR ESTÁ CAPACITADO E HABILITADO E POSSUI IDENTIFICAÇÃO VÁLIDA EM LOCAL VISÍVEL?',NULL),
  (9,'O OPERADOR POSSUI E UTILIZA OS EPIS NECESSÁRIOS PARA OS RISCOS DA OPERAÇÃO?',NULL),
  (10,'O ALARME DE RÉ E A BUZINA ESTÃO FUNCIONANDO?',NULL),
  (11,'O SISTEMA ELÉTRICO, INCLUINDO FARÓIS E COMANDOS DE ACIONAMENTO, FOI TESTADO E ESTÁ FUNCIONANDO?',NULL),
  (12,'TODO O SISTEMA DE FRENAGEM FOI TESTADO E ESTÁ FUNCIONANDO?',NULL),
  (13,'OS PNEUS ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (14,'A CABINE, AS ALAVANCAS E OS PAINÉIS ESTÃO EM BOAS CONDIÇÕES DE OPERAÇÃO?',NULL),
  (15,'O EXTINTOR DE INCÊNDIO ESTÁ DISPONÍVEL E EM CONDIÇÕES DE USO?',NULL),
  (16,'O SISTEMA DE CARREGAMENTO, INCLUINDO BRAÇOS, PROTEÇÕES E DEMAIS COMPONENTES, ESTÁ LIVRE DE ANOMALIAS?',NULL),
  (17,'A SINALIZAÇÃO DE ADVERTÊNCIA ESTÁ EM CONFORMIDADE COM O MANUAL DO FABRICANTE?',NULL),
  (18,'(GRUA OU GARRA) OS PISTÕES, AS MANGUEIRAS E AS CONEXÕES ESTÃO LIVRES DE VAZAMENTOS?',NULL),
  (19,'(GRUA OU GARRA) AS PATOLAS ESTÃO FUNCIONANDO CORRETAMENTE?',NULL),
  (20,'(GRUA OU GARRA) A INDICAÇÃO DA CAPACIDADE MÁXIMA DE CARGA ESTÁ LEGÍVEL E EM LOCAL VISÍVEL?',NULL),
  (21,'(GRUA OU GARRA) AS GARRAS ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (22,'(GRUA OU GARRA) O PAINEL DE COMANDO POSSUI IDENTIFICAÇÕES LEGÍVEIS?',NULL),
  (23,'A CINTA POSSUI ETIQUETA DE IDENTIFICAÇÃO LEGÍVEL, CONTENDO A CAPACIDADE MÁXIMA DE CARGA E AS DEMAIS INFORMAÇÕES DO FABRICANTE?',NULL),
  (24,'A CAPACIDADE DA CINTA É COMPATÍVEL COM O PESO DA CARGA E COM A FORMA DE AMARRAÇÃO UTILIZADA?',NULL),
  (25,'A CINTA ESTÁ LIVRE DE CORTES, RASGOS, FUROS, DESFIAMENTOS OU DESGASTE EXCESSIVO?',NULL),
  (26,'AS COSTURAS DA CINTA ESTÃO ÍNTEGRAS E LIVRES DE ROMPIMENTOS OU SOLTURAS?',NULL),
  (27,'A CINTA ESTÁ LIVRE DE NÓS, TORÇÕES OU EMENDAS IMPROVISADAS?',NULL),
  (28,'A CINTA ESTÁ LIVRE DE QUEIMADURAS, RESSECAMENTO OU DANOS CAUSADOS POR CALOR, PRODUTOS QUÍMICOS OU EXPOSIÇÃO EXCESSIVA AO SOL?',NULL),
  (29,'OS OLHAIS E PONTOS DE CONTATO DA CINTA ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (30,'SÃO UTILIZADAS PROTEÇÕES ADEQUADAS NOS CANTOS VIVOS E NAS SUPERFÍCIES QUE POSSAM DANIFICAR A CINTA?',NULL),
  (31,'OS GANCHOS, MANILHAS, ANÉIS E DEMAIS ACESSÓRIOS UTILIZADOS COM A CINTA ESTÃO ÍNTEGROS, IDENTIFICADOS E COMPATÍVEIS COM A CARGA?',NULL),
  (32,'A CINTA ESTÁ CORRETAMENTE POSICIONADA, SEM RISCO DE ESCORREGAMENTO OU PRENSAMENTO DURANTE A OPERAÇÃO?',NULL),
  (33,'A CINTA FOI INSPECIONADA ANTES DO INÍCIO DA OPERAÇÃO?',NULL),
  (34,'AS CINTAS DANIFICADAS OU SEM IDENTIFICAÇÃO SÃO RETIRADAS DE USO E SEGREGADAS PARA EVITAR SUA REUTILIZAÇÃO?',NULL),
  (35,'AS CINTAS SÃO ARMAZENADAS EM LOCAL LIMPO, SECO, PROTEGIDO DO SOL E AFASTADO DE PRODUTOS QUÍMICOS?',NULL),
  (36,'EXISTE REGISTRO DE INSPEÇÃO PERIÓDICA DAS CINTAS E DOS ACESSÓRIOS DE ELEVAÇÃO?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist PETM') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'OS ADESIVOS DE SEGURANÇA E A CINTA ANTIESTÁTICA ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (2,'O EQUIPAMENTO ESTÁ LIVRE DE RUÍDOS ANORMAIS E VAZAMENTOS?',NULL),
  (3,'A ESTRUTURA DO GUARDA-CORPO ESTÁ EM BOAS CONDIÇÕES?',NULL),
  (4,'A TRELIÇA DE ELEVAÇÃO, OS BRAÇOS E A ESTRUTURA ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (5,'AS ESCADAS E OS ACESSOS ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (6,'O PAINEL ELÉTRICO E AS LUZES ESTÃO FUNCIONANDO?',NULL),
  (7,'O EXTINTOR ESTÁ CARREGADO E DENTRO DO PRAZO DE VALIDADE?',NULL),
  (8,'O SINALIZADOR LUMINOSO ESTÁ FUNCIONANDO?',NULL),
  (9,'A PROTEÇÃO DO OPERADOR E O CINTO DE SEGURANÇA ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (10,'OS PNEUS E AS RODAS ESTÃO EM BOAS CONDIÇÕES DE USO?',NULL),
  (11,'AS MANGUEIRAS HIDRÁULICAS ESTÃO EM BOAS CONDIÇÕES E LIVRES DE VAZAMENTOS?',NULL),
  (12,'O SINALIZADOR SONORO ESTÁ FUNCIONANDO?',NULL),
  (13,'O PLUGUE DO CARREGADOR ESTÁ NO LOCAL CORRETO?',NULL),
  (14,'A BUZINA ESTÁ FUNCIONANDO?',NULL),
  (15,'A INDICAÇÃO DA CAPACIDADE MÁXIMA DE CARGA ESTÁ LEGÍVEL E EM LOCAL VISÍVEL?',NULL),
  (16,'OS BOTÕES DE EMERGÊNCIA ESTÃO FUNCIONANDO?',NULL),
  (17,'O SISTEMA DE DESCIDA AUXILIAR FOI INSPECIONADO E ESTÁ FUNCIONANDO CONFORME O PROCEDIMENTO DO FABRICANTE?',NULL),
  (18,'A PINTURA E O ASPECTO VISUAL DO EQUIPAMENTO ESTÃO SATISFATÓRIOS?',NULL),
  (19,'O EQUIPAMENTO ESTÁ LIMPO?',NULL),
  (20,'O HORÍMETRO ESTÁ FUNCIONANDO?',NULL),
  (21,'(ITENS DE SEGURANÇA) O CINTO ESTÁ LIMPO E ISENTO DE ÓLEOS, GRAXAS E OUTROS PRODUTOS QUÍMICOS?',NULL),
  (22,'(ITENS DE SEGURANÇA) O CINTO ESTÁ COMPLETO, SEM AUSÊNCIA DE PARTES OU COMPONENTES?',NULL),
  (23,'(ITENS DE SEGURANÇA) O CINTO ESTÁ EM PERFEITO ESTADO DE CONSERVAÇÃO, SEM PARTES DEFORMADAS, PARTIDAS, CORTADAS OU FROUXAS?',NULL),
  (24,'(ITENS DE SEGURANÇA) AS ARGOLAS ESTÃO EM BOAS CONDIÇÕES E LIVRES DE TRINCAS?',NULL),
  (25,'(ITENS DE SEGURANÇA) O TALABARTE ESTÁ EM PERFEITO ESTADO, SEM CORTES, FIOS ROMPIDOS, ILHOSES OXIDADOS, RESSECAMENTO OU DANOS CAUSADOS POR PRODUTOS QUÍMICOS?',NULL),
  (26,'(ITENS DE SEGURANÇA) OS ILHOSES E/OU AS FIVELAS DO CINTO ESTÃO LIVRES DE FERRUGEM?',NULL),
  (27,'(ITENS DE SEGURANÇA) O MOSQUETÃO ESTÁ EM BOAS CONDIÇÕES E TRAVANDO CORRETAMENTE?',NULL),
  (28,'(ITENS DE SEGURANÇA) O CINTO POSSUI PONTO DE ANCORAGEM PARA RESGATE EM ESPAÇO CONFINADO?',NULL),
  (29,'(ITENS DE SEGURANÇA) O NÚMERO DO CA DOS EPIS ESTÁ IDENTIFICADO COM GRAVAÇÃO VISÍVEL?',NULL),
  (30,'(ITENS DE SEGURANÇA) A TRAVA DO GANCHO DO TALABARTE ESTÁ EM PERFEITO ESTADO, COM DUPLO TRAVAMENTO, MOLAS ÍNTEGRAS E SEM PARTES QUEBRADAS OU OXIDADAS?',NULL),
  (31,'(ITENS DE SEGURANÇA) A DATA DE FABRICAÇÃO E OS LOTES DO CINTURÃO E DOS TALABARTES ESTÃO IDENTIFICADOS DE FORMA VISÍVEL?',NULL),
  (32,'(ITENS DE SEGURANÇA) O ABSORVEDOR DE ENERGIA ESTÁ EM PERFEITO ESTADO E SEM ROMPIMENTO DAS COSTURAS?',NULL),
  (33,'(ITENS DE SEGURANÇA) O CINTO DE SEGURANÇA FOI COLOCADO E AJUSTADO CORRETAMENTE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Perfuratriz') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A ÁREA DE CIRCULAÇÃO E OS ESPAÇOS AO ENTORNO ESTÃO LIVRES, ISOLADOS E SINALIZADOS?',NULL),
  (2,'A BATERIA POSSUI PROTEÇÃO NOS POLOS?',NULL),
  (3,'A LIGAÇÃO DE ENERGIA É REALIZADA POR MEIO DE CONJUNTO PLUGUE E TOMADA?',NULL),
  (4,'AS HASTES DE PERFURAÇÃO ESTÃO EM CONDIÇÕES DE USO?',NULL),
  (5,'AS LIGAÇÕES DE FASE, NEUTRO E TERRA, INCLUINDO O ATERRAMENTO DA CARCAÇA, FORAM INSTALADAS POR PROFISSIONAL AUTORIZADO?',NULL),
  (6,'O CABO POSSUI DUPLO ISOLAMENTO, ESTÁ SUSPENSO, DESENROLADO E LIVRE DE EMENDAS, AVARIAS, DANOS E CONTATO COM ÁGUA?',NULL),
  (7,'A CARCAÇA, AS ALÇAS, AS MANOPLAS, AS PRESILHAS E OS DEMAIS DISPOSITIVOS DE TRANSPORTE E MANOBRA ESTÃO LIVRES DE TRINCAS, AVARIAS OU DEFORMAÇÕES?',NULL),
  (8,'A DESCARGA DE FUMAÇA ESTÁ DIRECIONADA PARA LOCAL VENTILADO E AFASTADO DE PESSOAS, COM CONTROLE DA EMISSÃO DE GASES POLUENTES E RUÍDOS?',NULL),
  (9,'O ESCAPAMENTO POSSUI PROTEÇÃO CONTRA CONTATO COM PARTES QUENTES?',NULL),
  (10,'O EQUIPAMENTO ESTÁ LIVRE DE VIBRAÇÕES E RUÍDOS ANORMAIS DURANTE O FUNCIONAMENTO?',NULL),
  (11,'EXISTE BACIA DE CONTENÇÃO COM CAPACIDADE ADEQUADA PARA CONTER O ÓLEO EM CASO DE DERRAMAMENTO?',NULL),
  (12,'EXISTE IDENTIFICAÇÃO DA TENSÃO NO EQUIPAMENTO E NO RAMAL OU TOMADA DE ENERGIA?',NULL),
  (13,'EXISTEM SISTEMAS DE ANCORAGEM DIANTEIRO E TRASEIRO?',NULL),
  (14,'O SISTEMA AUTOMÁTICO DE COLOCAÇÃO DAS HASTES E O SISTEMA DE ESTEIRAS ESTÃO FUNCIONANDO?',NULL),
  (15,'EXISTEM PROTEÇÕES MECÂNICAS CONTRA CONTATO ACIDENTAL COM PARTES MÓVEIS?',NULL),
  (16,'O EXTINTOR DE INCÊNDIO É ADEQUADO AO EQUIPAMENTO, ESTÁ INSPECIONADO E CARREGADO?',NULL),
  (17,'O EQUIPAMENTO ESTÁ LIVRE DE VAZAMENTOS DE COMBUSTÍVEL, ÓLEO OU AR COMPRIMIDO E DE FUGAS DE ENERGIA?',NULL),
  (18,'OS MANÔMETROS ESTÃO REGULADOS E FUNCIONANDO?',NULL),
  (19,'O RAMAL DE ENERGIA POSSUI PROTEÇÃO POR DISPOSITIVO DIFERENCIAL RESIDUAL?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Plataforma Elevatória') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A CONCHA, A CABINE, A LANÇA, A TRAVA E O BRAÇO DE ARTICULAÇÃO ESTÃO LIVRES DE AVARIAS E DANOS, COMO TRINCAS E DENTES QUEBRADOS?',NULL),
  (2,'AS ALAVANCAS DE COMANDO E OS SISTEMAS OPERACIONAL, DE ELEVAÇÃO, DA CAÇAMBA E COMPUTADORIZADO ESTÃO FUNCIONANDO?',NULL),
  (3,'AS BORDAS, OS CANTOS, A LÂMINA E A PONTA RIPPER ESTÃO LIVRES DE DESGASTES?',NULL),
  (4,'O ASSENTO ESTÁ FIXO E POSSUI CINTO DE SEGURANÇA DE TRÊS PONTOS E ENCOSTO DE CABEÇA?',NULL),
  (5,'AS FITAS REFLETIVAS ESTÃO INSTALADAS NAS LATERAIS EXTERNAS E A BANDEIROLA E O GIROFLEX ESTÃO FUNCIONANDO, QUANDO APLICÁVEIS?',NULL),
  (6,'A BUZINA, O VOLANTE, A EMBREAGEM, O ACELERADOR, O SISTEMA DE FREIOS, OS DISPOSITIVOS DE COMANDO E A CHAVE GERAL PARA DESENERGIZAÇÃO DO SISTEMA ELÉTRICO ESTÃO FUNCIONANDO?',NULL),
  (7,'A CABINE POSSUI AR-CONDICIONADO QUANDO ESSA MEDIDA DE CONTROLE ESTÁ PREVISTA NO PGR?',NULL),
  (8,'AS CORREIAS DA HÉLICE E DO ALTERNADOR ESTÃO LIVRES DE AVARIAS?',NULL),
  (9,'O DISPOSITIVO DE ACIONAMENTO AUTOMÁTICO DOS FARÓIS, QUANDO DO ACIONAMENTO DA IGNIÇÃO, ESTÁ FUNCIONANDO?',NULL),
  (10,'O EXTINTOR DE INCÊNDIO É ADEQUADO AO EQUIPAMENTO, ESTÁ INSPECIONADO E CARREGADO?',NULL),
  (11,'O KIT DE EMERGÊNCIA ESTÁ COMPLETO, ARMAZENADO ADEQUADAMENTE E COM A LISTAGEM DOS ITENS?',NULL),
  (12,'POSSUI PROTEÇÃO PARA O OPERADOR EM CASO DE CAPOTAMENTO E QUEDA DE MATERIAIS (“ROPS” E “FOPS”)?',NULL),
  (13,'O SISTEMA HIDRÁULICO, AS CONEXÕES E AS MANGUEIRAS ESTÃO EM BOAS CONDIÇÕES E LIVRES DE VAZAMENTOS?',NULL),
  (14,'AS PARTES ROTATIVAS DO MOTOR ESTÃO TOTALMENTE PROTEGIDAS?',NULL),
  (15,'AS SETAS DIANTEIRAS E TRASEIRAS, A LUZ DE FREIO, A LUZ DE NEBLINA, O ALARME E A LUZ DE MARCHA À RÉ, O PISCA-ALERTA E A COMUTAÇÃO DOS FARÓIS ALTO/BAIXO ESTÃO FUNCIONANDO?',NULL),
  (16,'POSSUI RECIPIENTE PARA COLETA DE LIXO?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Tombador') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'OS PNEUS ESTÃO EM BOM ESTADO E NÃO ATINGIRAM O INDICADOR DE DESGASTE TWI?',NULL),
  (2,'A CARGA POSSUI ALTURA MÁXIMA DE 4,00 METROS PARA ACESSO AO PORTÃO DO TOMBADOR?',NULL),
  (3,'O TANQUE DE COMBUSTÍVEL ESTÁ COM O NÍVEL PERMITIDO PELO PROCEDIMENTO ITSUPP0001?',NULL),
  (4,'O PARAFUSO DO MOLEJO ESTÁ POSICIONADO ADEQUADAMENTE?',NULL),
  (5,'O MOTORISTA RECEBEU ORIENTAÇÕES DE SEGURANÇA PARA A MOVIMENTAÇÃO DA CARGA?',NULL),
  (6,'O MOTORISTA ESTÁ EM CONDIÇÕES ADEQUADAS PARA CONDUZIR, SEM SINAIS DE CANSAÇO, SONOLÊNCIA OU ALTERAÇÃO DA CAPACIDADE PSICOMOTORA?',NULL),
  (7,'O VEÍCULO POSSUI PONTO FRONTAL PARA ANCORAGEM DO CABO DE AÇO?',NULL),
  (8,'O COMPRIMENTO DO VEÍCULO, MEDIDO DO PRIMEIRO EIXO DO CAVALO MECÂNICO AO ÚLTIMO EIXO DA CARRETA, É IGUAL OU INFERIOR A 16 METROS, CONFORME O PROCEDIMENTO ITSUPP0001?',NULL),
  (9,'O VEÍCULO RESPEITA O LIMITE DE PESO DE 30.000 KG PARA DESCARGA, CONFORME O PROCEDIMENTO ITSUPP0001?',NULL),
  (10,'A CNH DO MOTORISTA ESTÁ VÁLIDA E CORRESPONDE À CATEGORIA DO VEÍCULO?',NULL),
  (11,'O VEÍCULO ESTÁ EM BOM ESTADO DE CONSERVAÇÃO E LIVRE DE VAZAMENTOS DE ÓLEO OU COMBUSTÍVEL?',NULL),
  (12,'A FUNILARIA DA CABINE ESTÁ EM BOAS CONDIÇÕES E SEM PEÇAS OU PARTES SOLTAS?',NULL),
  (13,'AS LATERAIS E O ASSOALHO DA CARROCERIA ESTÃO EM BOM ESTADO, SEM FUROS OU PREGOS EXPOSTOS?',NULL),
  (14,'O TANQUE DE COMBUSTÍVEL ESTÁ EM BOM ESTADO, SEM SINAIS DE CORROSÃO, FUROS OU VAZAMENTOS?',NULL),
  (15,'O MOTORISTA ESTÁ TRAJADO CONFORME AS REGRAS DO LOCAL, COM CALÇA, CALÇADO FECHADO E CAMISA DE MANGA CURTA OU LONGA?',NULL),
  (16,'O VEÍCULO POSSUI ALARME SONORO DE MARCHA À RÉ?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist Veiculos') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O PÁTIO DE CAMINHÕES ESTÁ ORGANIZADO DE FORMA A EVITAR COLISÕES?',NULL),
  (2,'O PISO ESTÁ LIVRE DE MANCHAS DE ÓLEO QUE POSSAM CAUSAR ACIDENTES?',NULL),
  (3,'A MANUTENÇÃO PREVENTIVA DOS CAMINHÕES ESTÁ EM DIA, CONFORME A PROGRAMAÇÃO?',NULL),
  (4,'A MANUTENÇÃO PREVENTIVA DOS CARROS ESTÁ EM DIA, CONFORME A PROGRAMAÇÃO?',NULL),
  (5,'A OFICINA ESTÁ LIMPA E ORGANIZADA?',NULL),
  (6,'OS PRODUTOS QUÍMICOS ESTÃO ARMAZENADOS EM ÁREA DE CONTENÇÃO?',NULL),
  (7,'OS PRODUTOS QUÍMICOS ESTÃO ROTULADOS E IDENTIFICADOS?',NULL),
  (8,'AS FDS DOS PRODUTOS QUÍMICOS UTILIZADOS ESTÃO DISPONÍVEIS NO LOCAL?',NULL),
  (9,'A MANGUEIRA DE AR COMPRIMIDO ESTÁ EM BOAS CONDIÇÕES E O LOCAL ESTÁ SINALIZADO?',NULL),
  (10,'EXISTE PROTEÇÃO ADEQUADA PARA A REALIZAÇÃO SEGURA DA TROCA DE PNEUS?',NULL),
  (11,'OS COLABORADORES DA OFICINA ESTÃO UTILIZANDO OS EPIS ADEQUADOS?',NULL),
  (12,'OS COLABORADORES DO LAVADOR ESTÃO UTILIZANDO OS EPIS ADEQUADOS?',NULL),
  (13,'EXISTE CHECKLIST PARA O MOTORISTA VERIFICAR AS CONDIÇÕES DE SEGURANÇA DO CAMINHÃO?',NULL),
  (14,'A ÁREA DE TROCA DE ÓLEO ESTÁ SINALIZADA QUANTO AOS RISCOS DE QUEDA?',NULL),
  (15,'OS CAMINHÕES EM MANUTENÇÃO ESTÃO DEVIDAMENTE CALÇADOS?',NULL),
  (16,'AS INSTALAÇÕES ELÉTRICAS ESTÃO EM CONFORMIDADE?',NULL),
  (17,'EXISTEM KITS DE CONTENÇÃO PARA CASOS DE DERRAMAMENTO?',NULL),
  (18,'O TANQUE DE COMBUSTÍVEL ESTÁ ATERRADO?',NULL),
  (19,'A ÁREA DE CONTENÇÃO DO TANQUE DE COMBUSTÍVEL ESTÁ LIVRE DE RESÍDUOS?',NULL),
  (20,'O LOCAL DE ABASTECIMENTO POSSUI SINALIZAÇÃO DE ALERTA SOBRE OS RISCOS?',NULL),
  (21,'O LOCAL ESTÁ LIVRE DE FONTES OU SITUAÇÕES QUE POSSAM INICIAR UM INCÊNDIO?',NULL),
  (22,'EXISTEM EXTINTORES ADEQUADOS, SINALIZADOS E ACESSÍVEIS NO LOCAL?',NULL),
  (23,'(AMOSTRAL) OS PNEUS DOS CAMINHÕES ESTÃO EM BOM ESTADO?',NULL),
  (24,'(AMOSTRAL) O PARA-BRISA ESTÁ LIVRE DE TRINCAS?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist cinto de segurança') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O CINTO ENCONTRA-SE LIMPO E ISENTO DE ÓLEOS, GRAXAS E OUTROS PRODUTOS QUÍMICOS?',NULL),
  (2,'O CINTO ENCONTRA-SE COMPLETO, SEM AUSÊNCIA DE PARTES OU COMPONENTES?',NULL),
  (3,'O CINTO ESTÁ EM PERFEITO ESTADO DE CONSERVAÇÃO, SEM PARTES DEFORMADAS, PARTIDAS, CORTADAS OU FROUXAS?',NULL),
  (4,'AS ARGOLAS ESTÃO EM BOAS CONDIÇÕES E SEM TRINCAS?',NULL),
  (5,'O TALABARTE ENCONTRA-SE EM PERFEITO ESTADO DE CONSERVAÇÃO, SEM CORTES, FIOS ROMPIDOS, ILHOSES OXIDADOS, RESSECAMENTO OU CORROSÃO POR PRODUTOS QUÍMICOS?',NULL),
  (6,'OS ILHOSES E/OU AS FIVELAS DO CINTO DE SEGURANÇA ESTÃO SEM SINAIS DE FERRUGEM?',NULL),
  (7,'O MOSQUETÃO ESTÁ EM BOAS CONDIÇÕES E TRAVANDO CORRETAMENTE?',NULL),
  (8,'O CINTO POSSUI PONTO DE ANCORAGEM PARA RESGATE EM ESPAÇO CONFINADO?',NULL),
  (9,'O NÚMERO DO CA DOS EPIS ESTÁ IDENTIFICADO COM GRAVAÇÃO VISÍVEL?',NULL),
  (10,'A TRAVA DO GANCHO DO TALABARTE ENCONTRA-SE EM PERFEITO ESTADO, COM DUPLO TRAVAMENTO, MOLAS ÍNTEGRAS E SEM PARTES QUEBRADAS OU OXIDADAS?',NULL),
  (11,'A DATA DE FABRICAÇÃO E OS LOTES DO CINTURÃO E DOS TALABARTES ESTÃO IDENTIFICADOS DE FORMA VISÍVEL?',NULL),
  (12,'O ABSORVEDOR DE ENERGIA ESTÁ EM PERFEITO ESTADO, SEM ROMPIMENTO DAS COSTURAS?',NULL),
  (13,'O CINTO DE SEGURANÇA FOI COLOCADO E AJUSTADO CORRETAMENTE?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist inspeção diária de caldeira') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'(VERIFICAR NA PARTIDA) O NÍVEL DE ÁGUA DO CONDENSADO ESTÁ ADEQUADO?',NULL),
  (2,'(VERIFICAR NA PARTIDA) O NÍVEL DO RESERVATÓRIO DE SEGURANÇA COMODORO ESTÁ ADEQUADO?',NULL),
  (3,'(VERIFICAR NA PARTIDA) O TRATAMENTO DA ÁGUA FOI CONFERIDO E ESTÁ ADEQUADO?',NULL),
  (4,'(VERIFICAR NA PARTIDA) O NÍVEL DE ÁGUA DA CALDEIRA ESTÁ ADEQUADO?',NULL),
  (5,'(VERIFICAR NA PARTIDA) OS REGISTROS DAS BOMBAS FORAM ABERTOS?',NULL),
  (6,'(VERIFICAR NA PARTIDA) A BOMBA 01 FUNCIONOU DURANTE O TESTE MANUAL?',NULL),
  (7,'(VERIFICAR NA PARTIDA) A BOMBA 02 FUNCIONOU DURANTE O TESTE MANUAL?',NULL),
  (8,'(VERIFICAR NA PARTIDA) A VÁLVULA DE DESCARGA DE FUNDO 01 FUNCIONOU DURANTE O TESTE?',NULL),
  (9,'(VERIFICAR NA PARTIDA) A VÁLVULA DE DESCARGA DE FUNDO 02 FUNCIONOU DURANTE O TESTE?',NULL),
  (10,'(VERIFICAR NA PARTIDA) O EXAUSTOR FUNCIONOU DURANTE O TESTE?',NULL),
  (11,'(VERIFICAR NA PARTIDA) O BYPASS FOI ABERTO?',NULL),
  (12,'(VERIFICAR NA PARTIDA) HÁ VAZAMENTOS? EM CASO POSITIVO, DETALHAR NAS OBSERVAÇÕES GERAIS.',NULL),
  (13,'(VERIFICAR NA PARTIDA) O TESTE MANUAL DA VÁLVULA DE SEGURANÇA FOI REALIZADO ACIMA DE 7 KGF/CM²?',NULL),
  (14,'(VERIFICAR NA PARTIDA) A PARTIDA FOI REALIZADA?',NULL),
  (15,'HORA DA PARTIDA:',NULL),
  (16,'HÁ SS ABERTA? INFORME O NÚMERO.',NULL),
  (17,'QUAL É A PRESSÃO ATUAL EM KGF/CM²?',NULL),
  (18,'(APÓS O DESLIGAMENTO) A PRESSÃO ATUAL ESTÁ ABAIXO DE 6 KGF/CM²?',NULL),
  (19,'(APÓS O DESLIGAMENTO) A FORNALHA ESTÁ COM POUCO COMBUSTÍVEL EM COMBUSTÃO?',NULL),
  (20,'(APÓS O DESLIGAMENTO) O EXAUSTOR FOI DESLIGADO?',NULL),
  (21,'(APÓS O DESLIGAMENTO) O NÍVEL DE ÁGUA DA CALDEIRA ESTÁ ACIMA DO VISOR?',NULL),
  (22,'(APÓS O DESLIGAMENTO) OS REGISTROS DAS BOMBAS FORAM FECHADOS?',NULL),
  (23,'(APÓS O DESLIGAMENTO) O ABAFADOR DA CHAMINÉ ESTÁ FECHADO?',NULL),
  (24,'(APÓS O DESLIGAMENTO) O REGISTRO DE DESCARGA DE FUNDO ESTÁ FECHADO?',NULL),
  (25,'(APÓS O DESLIGAMENTO) O NÍVEL DO CONDENSADO FOI VERIFICADO?',NULL),
  (26,'(APÓS O DESLIGAMENTO) HORA DO DESLIGAMENTO:',NULL),
  (27,'(APÓS O DESLIGAMENTO) OS EPIS ESTÃO ADEQUADOS PARA O ABASTECIMENTO DA FORNALHA?',NULL),
  (28,'(APÓS O DESLIGAMENTO) O CARRINHO DE LENHA ESTÁ ADEQUADO?',NULL),
  (29,'(APÓS O DESLIGAMENTO) HÁ EXTINTORES PRÓXIMOS E ACESSÍVEIS?',NULL),
  (30,'(APÓS O DESLIGAMENTO) O AMBIENTE ESTÁ LIMPO E ORGANIZADO?',NULL),
  (31,'(MANUTENÇÃO) A SS ATENDIDA FOI RESOLVIDA?',NULL),
  (32,'(MANUTENÇÃO) FOI REALIZADA MANUTENÇÃO PREVENTIVA? EM CASO POSITIVO, DETALHAR NAS OBSERVAÇÕES.',NULL),
  (33,'(MANUTENÇÃO) FOI REALIZADA MANUTENÇÃO PREDITIVA? EM CASO POSITIVO, DETALHAR NAS OBSERVAÇÕES.',NULL),
  (34,'(MANUTENÇÃO) FOI REALIZADA ALGUMA MELHORIA? EM CASO POSITIVO, DETALHAR NAS OBSERVAÇÕES.',NULL),
  (35,'(MANUTENÇÃO) FOI REALIZADA MANUTENÇÃO CORRETIVA? EM CASO POSITIVO, DETALHAR NAS OBSERVAÇÕES.',NULL),
  (36,'(MANUTENÇÃO) HOUVE ATENDIMENTO A ALGUMA SS? EM CASO POSITIVO, REGISTRAR AS INFORMAÇÕES.',NULL),
  (37,'(MANUTENÇÃO) NÚMERO DA SS ATENDIDA:',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist maquinas autopropelidas ou similares') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'O VEÍCULO ESTÁ LIVRE DE VAZAMENTOS?',NULL),
  (2,'O NÍVEL DO ÓLEO DO MOTOR ESTÁ ADEQUADO?',NULL),
  (3,'O NÍVEL DO ÓLEO HIDRÁULICO ESTÁ ADEQUADO?',NULL),
  (4,'O NÍVEL DO ÓLEO DA TRANSMISSÃO ESTÁ ADEQUADO?',NULL),
  (5,'A CORREIA DO ALTERNADOR ESTÁ LIVRE DE ANOMALIAS?',NULL),
  (6,'OS FILTROS DE AR INTERNO E EXTERNO ESTÃO EM CONDIÇÕES NORMAIS DE FUNCIONAMENTO?',NULL),
  (7,'O NÍVEL DO LÍQUIDO DE ARREFECIMENTO DO RADIADOR ESTÁ ADEQUADO E O RESERVATÓRIO POSSUI TAMPA?',NULL),
  (8,'O OPERADOR ESTÁ CAPACITADO E HABILITADO E POSSUI IDENTIFICAÇÃO VÁLIDA EM LOCAL VISÍVEL?',NULL),
  (9,'O OPERADOR POSSUI E UTILIZA OS EPIS NECESSÁRIOS PARA OS RISCOS DA OPERAÇÃO?',NULL),
  (10,'O ALARME DE RÉ E A BUZINA ESTÃO FUNCIONANDO?',NULL),
  (11,'O SISTEMA ELÉTRICO, INCLUINDO FARÓIS E COMANDOS DE ACIONAMENTO, FOI TESTADO E ESTÁ FUNCIONANDO?',NULL),
  (12,'TODO O SISTEMA DE FRENAGEM FOI TESTADO E ESTÁ FUNCIONANDO?',NULL),
  (13,'OS PNEUS ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (14,'A CABINE, AS ALAVANCAS E OS PAINÉIS ESTÃO EM BOAS CONDIÇÕES DE OPERAÇÃO?',NULL),
  (15,'O EXTINTOR DE INCÊNDIO ESTÁ DISPONÍVEL E EM CONDIÇÕES DE USO?',NULL),
  (16,'O SISTEMA DE CARREGAMENTO, INCLUINDO PÁ CARREGADEIRA, BRAÇOS E PROTEÇÕES, ESTÁ LIVRE DE ANOMALIAS?',NULL),
  (17,'A SINALIZAÇÃO DE ADVERTÊNCIA ESTÁ EM CONFORMIDADE COM O MANUAL DO FABRICANTE?',NULL),
  (18,'(GRUA, GARRA OU CARREGADOR FLORESTAL) OS PISTÕES, AS MANGUEIRAS E AS CONEXÕES ESTÃO LIVRES DE VAZAMENTOS?',NULL),
  (19,'(GRUA, GARRA OU CARREGADOR FLORESTAL) AS PATOLAS ESTÃO FUNCIONANDO CORRETAMENTE?',NULL),
  (20,'(GRUA, GARRA OU CARREGADOR FLORESTAL) A INDICAÇÃO DA CAPACIDADE MÁXIMA DE CARGA ESTÁ LEGÍVEL E EM LOCAL VISÍVEL?',NULL),
  (21,'(GRUA, GARRA OU CARREGADOR FLORESTAL) AS GARRAS ESTÃO EM BOAS CONDIÇÕES?',NULL),
  (22,'(GRUA, GARRA OU CARREGADOR FLORESTAL) O PAINEL DE COMANDO POSSUI IDENTIFICAÇÕES LEGÍVEIS?',NULL)
) AS v(ordem, pergunta, icone);--> statement-breakpoint
WITH m AS (INSERT INTO "checklist_modelos" ("nome") VALUES ('Checklist ônibus-Vans-Micro-Ônibus') RETURNING "id")
INSERT INTO "checklist_modelo_itens" ("modelo_id","ordem","pergunta","icone")
SELECT m."id", v.ordem::integer, v.pergunta, v.icone FROM m, (VALUES
  (1,'A ÁREA DE CIRCULAÇÃO E OS ESPAÇOS AO ENTORNO ESTÃO LIVRES, ISOLADOS E SINALIZADOS?',NULL),
  (2,'A BATERIA POSSUI PROTEÇÃO NOS POLOS?',NULL),
  (3,'A LIGAÇÃO DE ENERGIA É REALIZADA POR MEIO DE CONJUNTO PLUGUE E TOMADA?',NULL),
  (4,'AS HASTES DE PERFURAÇÃO ESTÃO EM CONDIÇÕES DE USO?',NULL),
  (5,'AS LIGAÇÕES DE FASE, NEUTRO E TERRA, INCLUINDO O ATERRAMENTO DA CARCAÇA, FORAM INSTALADAS POR PROFISSIONAL AUTORIZADO?',NULL),
  (6,'O CABO POSSUI DUPLO ISOLAMENTO, ESTÁ SUSPENSO, DESENROLADO E LIVRE DE EMENDAS, AVARIAS, DANOS E CONTATO COM ÁGUA?',NULL),
  (7,'A CARCAÇA, AS ALÇAS, AS MANOPLAS, AS PRESILHAS E OS DEMAIS DISPOSITIVOS DE TRANSPORTE E MANOBRA ESTÃO LIVRES DE TRINCAS, AVARIAS OU DEFORMAÇÕES?',NULL),
  (8,'A DESCARGA DE FUMAÇA ESTÁ DIRECIONADA PARA LOCAL VENTILADO E AFASTADO DE PESSOAS, COM CONTROLE DA EMISSÃO DE GASES POLUENTES E RUÍDOS?',NULL),
  (9,'O ESCAPAMENTO POSSUI PROTEÇÃO CONTRA CONTATO COM PARTES QUENTES?',NULL),
  (10,'O EQUIPAMENTO ESTÁ LIVRE DE VIBRAÇÕES E RUÍDOS ANORMAIS DURANTE O FUNCIONAMENTO?',NULL),
  (11,'EXISTE BACIA DE CONTENÇÃO COM CAPACIDADE ADEQUADA PARA CONTER O ÓLEO EM CASO DE DERRAMAMENTO?',NULL),
  (12,'EXISTE IDENTIFICAÇÃO DA TENSÃO NO EQUIPAMENTO E NO RAMAL OU TOMADA DE ENERGIA?',NULL),
  (13,'EXISTEM SISTEMAS DE ANCORAGEM DIANTEIRO E TRASEIRO?',NULL),
  (14,'O SISTEMA AUTOMÁTICO DE COLOCAÇÃO DAS HASTES E O SISTEMA DE ESTEIRAS ESTÃO FUNCIONANDO?',NULL),
  (15,'EXISTEM PROTEÇÕES MECÂNICAS CONTRA CONTATO ACIDENTAL COM PARTES MÓVEIS?',NULL),
  (16,'O EXTINTOR DE INCÊNDIO É ADEQUADO AO EQUIPAMENTO, ESTÁ INSPECIONADO E CARREGADO?',NULL),
  (17,'O EQUIPAMENTO ESTÁ LIVRE DE VAZAMENTOS DE COMBUSTÍVEL, ÓLEO OU AR COMPRIMIDO E DE FUGAS DE ENERGIA?',NULL),
  (18,'OS MANÔMETROS ESTÃO REGULADOS E FUNCIONANDO?',NULL),
  (19,'O RAMAL DE ENERGIA POSSUI PROTEÇÃO POR DISPOSITIVO DIFERENCIAL RESIDUAL?',NULL)
) AS v(ordem, pergunta, icone);
