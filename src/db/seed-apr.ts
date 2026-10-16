import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  apr,
  aprAtividade,
  aprControle,
  aprRisco,
  atividadeRisco,
  atividadeTermos,
  atividades,
  medidasControle,
  nrs,
  obras,
  riscoControle,
  riscoNr,
  riscos,
  usuarios,
} from "@/db/schema";
import type { Probabilidade, Severidade, TipoControle } from "@/lib/apr/types";

let seeded = false;
let seeding: Promise<void> | null = null;

/** Garante base mínima (usuários, obras e base de conhecimento). Idempotente. */
export async function ensureSeeded() {
  if (seeded) return;
  if (seeding) return seeding;
  seeding = (async () => {
    try {
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(atividades);
      if (Number(count) === 0) {
        await seedTudo();
      } else {
        await syncNovosItens();
      }
      // Índices de similaridade (opcional; ignora se a extensão não estiver disponível)
      try {
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
        await db.execute(
          sql`CREATE INDEX IF NOT EXISTS atividades_nome_trgm_idx ON atividades USING gin (nome gin_trgm_ops)`,
        );
        await db.execute(
          sql`CREATE INDEX IF NOT EXISTS atividade_termos_termo_trgm_idx ON atividade_termos USING gin (termo gin_trgm_ops)`,
        );
      } catch {
        /* extensão indisponível: busca em memória continua funcionando */
      }
      seeded = true;
    } finally {
      seeding = null;
    }
  })();
  return seeding;
}

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------
const NRS: [string, string][] = [
  ["NR-06", "Equipamento de Proteção Individual"],
  ["NR-09", "Avaliação e Controle das Exposições Ocupacionais"],
  ["NR-10", "Segurança em Instalações e Serviços em Eletricidade"],
  ["NR-11", "Transporte, Movimentação, Armazenagem e Manuseio de Materiais"],
  ["NR-12", "Segurança no Trabalho em Máquinas e Equipamentos"],
  ["NR-15", "Atividades e Operações Insalubres"],
  ["NR-17", "Ergonomia"],
  ["NR-18", "Segurança e Saúde no Trabalho na Indústria da Construção"],
  ["NR-23", "Proteção Contra Incêndios"],
  ["NR-26", "Sinalização de Segurança"],
  ["NR-33", "Segurança e Saúde nos Trabalhos em Espaços Confinados"],
  ["NR-35", "Trabalho em Altura"],
];

type ControleSeed = [key: string, nome: string, tipo: TipoControle, descricao?: string];
const CONTROLES: ControleSeed[] = [
  ["cinto", "Cinto de segurança tipo paraquedista com talabarte duplo", "epi"],
  ["linha_vida", "Linha de vida ancorada em ponto certificado", "engenharia"],
  ["guarda_corpo", "Guarda-corpo e rodapé em periferias e aberturas", "engenharia"],
  ["capacete", "Capacete com jugular", "epi"],
  ["luvas_mec", "Luvas de proteção mecânica (vaqueta ou nitrílica)", "epi"],
  ["oculos", "Óculos de proteção contra impactos", "epi"],
  ["auricular", "Protetor auricular (plug ou concha)", "epi"],
  ["pff2", "Respirador PFF2 para poeiras", "epi"],
  ["botina", "Botina de segurança com biqueira", "epi"],
  ["loto", "Bloqueio e etiquetagem (LOTO) do circuito", "administrativo"],
  ["detector", "Teste de ausência de tensão com detector", "engenharia"],
  ["luvas_iso", "Luvas isolantes classe 0 com cobertura de vaqueta", "epi"],
  ["isolamento", "Isolamento e sinalização da área de trabalho", "administrativo"],
  ["dds", "Diálogo Diário de Segurança (DDS) antes do início", "administrativo"],
  ["pt", "Permissão de Trabalho (PT) emitida e assinada", "administrativo"],
  ["insp_pre", "Inspeção pré-uso de máquinas, ferramentas e acessórios", "administrativo"],
  ["protecoes", "Proteções fixas e móveis nas partes móveis", "engenharia"],
  ["escoramento", "Escoramento / entivação conforme projeto", "engenharia"],
  ["monitor", "Monitoramento contínuo de atmosfera (O2, LEL, H2S, CO)", "engenharia"],
  ["vigia", "Vigia treinado posicionado na entrada", "administrativo"],
  ["ventilacao", "Ventilação forçada / exaustão local", "engenharia"],
  ["nr35", "Treinamento NR-35 válido e ASO com aptidão para altura", "administrativo"],
  ["nr10", "Treinamento NR-10 válido", "administrativo"],
  ["nr33", "Treinamento NR-33 válido", "administrativo"],
  ["rigger", "Sinaleiro / amarrador (rigger) qualificado", "administrativo"],
  ["insp_cabos", "Inspeção de cabos, cintas e acessórios de içamento", "administrativo"],
  ["cabo_guia", "Cabo guia para controle da carga", "engenharia"],
  ["argamassa", "Substituir cimento ensacado por argamassa industrializada bombeada", "substituicao"],
  ["carrinho", "Uso de carrinho / equipamento para transporte de materiais", "engenharia"],
  ["pausas", "Pausas programadas e revezamento de função", "administrativo"],
  ["hidratacao", "Hidratação e ponto de sombra disponível", "administrativo"],
  ["extintor", "Extintor de incêndio junto à frente de trabalho", "engenharia"],
  ["masc_solda", "Máscara de solda com filtro adequado", "epi"],
  ["raspa", "Avental, mangote e perneira de raspa", "epi"],
  ["antichama", "Manta antichama e retirada de materiais combustíveis", "administrativo"],
  ["andaime_ok", "Andaime com base nivelada, contraventado e piso completo", "engenharia"],
  ["luvas_quim", "Luvas nitrílicas para produtos químicos", "epi"],
  ["fispq", "FDS/FISPQ disponível e treinamento sobre o produto", "administrativo"],
  ["montar_solo", "Eliminar o trabalho em altura com pré-montagem no solo", "eliminacao"],
  ["amarrar_ferr", "Ferramentas amarradas (prevenção de queda de objetos)", "engenharia"],
  ["aterramento", "Aterramento elétrico de equipamentos", "engenharia"],
  ["dr", "Dispositivo DR nos quadros de distribuição", "engenharia"],
  ["pta", "Uso de plataforma elevatória (PTA) em vez de escada", "substituicao"],
  ["housekeeping", "Limpeza e organização da área (housekeeping)", "administrativo"],
  ["bandejas", "Bandejas / redes de proteção contra queda de materiais", "engenharia"],
  ["primeiros_soc", "Kit de primeiros socorros e plano de emergência", "administrativo"],
  ["protetor_solar", "Protetor solar e vestimenta de manga longa", "epi"],
  ["resp_vapor", "Respirador com filtro para vapores orgânicos", "epi"],
  ["dupla_iso", "Ferramenta elétrica com dupla isolação", "engenharia"],
  ["raio_giro", "Delimitação do raio de giro de máquinas", "administrativo"],
  ["alarme_re", "Alarme sonoro de ré e sinaleiro de tráfego", "engenharia"],
  ["colete", "Colete refletivo", "epi"],
  ["corte_umido", "Corte úmido / umidificação para supressão de poeira", "engenharia"],
  ["biombo", "Biombo de proteção contra radiação de solda", "engenharia"],
  ["luvas_vib", "Luvas antivibração", "epi"],
  ["creme", "Creme protetor para as mãos", "epi"],
  // Novos controles
  ["tapume", "Barreiras físicas e tapumes para separar a frente de trabalho", "engenharia"],
  ["protecao_aberturas", "Proteção resistente e sinalizada de aberturas no piso", "engenharia"],
  ["escada_inspecionada", "Escada adequada à tarefa, inspecionada e posicionada corretamente", "administrativo"],
  ["ferramenta_correta", "Ferramenta adequada à atividade, sem improvisações", "administrativo"],
  ["protecao_vergalhao", "Protetores nas pontas expostas de vergalhões", "engenharia"],
  ["rede_subterranea", "Localização e identificação prévia de redes enterradas", "administrativo"],
  ["plano_escavacao", "Planejamento da escavação e inspeção das condições do terreno", "administrativo"],
  ["distancia_borda", "Materiais e equipamentos mantidos afastados da borda da escavação", "administrativo"],
  ["rota_pedestre", "Rotas de pedestres separadas e sinalizadas em relação aos veículos", "engenharia"],
  ["sinalizacao_transito", "Sinalização e controle de tráfego durante carga, descarga e manobras", "administrativo"],
  ["protecao_maquina", "Proteção e fixação adequada de máquinas e equipamentos", "engenharia"],
  ["aspiracao_po", "Aspiração localizada ou sistema de coleta de poeira na fonte", "engenharia"],
  ["protecao_auditiva", "Proteção auditiva selecionada conforme avaliação da exposição", "epi"],
  ["higiene_maos", "Higienização das mãos e proibição de comer na área contaminada", "administrativo"],
  ["higiene_saneamento", "Instalações sanitárias e pontos de lavagem adequados e acessíveis", "administrativo"],
  ["ergonomia_postos", "Ajuste do posto de trabalho, altura e alcance dos materiais", "engenharia"],
  ["levantamento_mecanico", "Uso de equipamento mecânico para movimentar cargas pesadas", "engenharia"],
  ["pausa_calor", "Pausas e organização do trabalho conforme condições de calor", "administrativo"],
  ["iluminacao", "Iluminação suficiente e adequada à tarefa", "engenharia"],
  ["inspecao_ferramentas", "Retirada de uso e identificação de ferramentas danificadas", "administrativo"],
  ["plano_resgate", "Plano de emergência e resgate compatível com a atividade", "administrativo"],
  ["comunicacao", "Meio de comunicação definido entre equipe, operador e sinaleiro", "administrativo"],
];

type RiscoSeed = [key: string, nome: string, nrs: string[], controles: [string, boolean][], descricao?: string];
const RISCOS: RiscoSeed[] = [
  ["queda_alt", "Queda de altura", ["NR-35", "NR-18"], [["cinto", true], ["linha_vida", true], ["nr35", true], ["pt", true], ["guarda_corpo", false], ["pta", false], ["montar_solo", false]], "Trabalho acima de 2 m do nível inferior com risco de queda."],
  ["queda_mat", "Queda de materiais e objetos", ["NR-18"], [["capacete", true], ["isolamento", true], ["amarrar_ferr", false], ["bandejas", false]]],
  ["choque", "Choque elétrico", ["NR-10"], [["loto", true], ["detector", true], ["nr10", true], ["luvas_iso", false], ["dr", false], ["aterramento", false], ["dupla_iso", false]]],
  ["arco", "Arco elétrico e queimadura", ["NR-10"], [["loto", true], ["nr10", true], ["pt", true], ["luvas_iso", false]]],
  ["soterramento", "Soterramento", ["NR-18"], [["escoramento", true], ["isolamento", true], ["pt", false]]],
  ["atmosfera", "Atmosfera perigosa / asfixia", ["NR-33"], [["monitor", true], ["vigia", true], ["nr33", true], ["pt", true], ["ventilacao", false]]],
  ["esmag_carga", "Esmagamento por carga suspensa", ["NR-11", "NR-18"], [["rigger", true], ["insp_cabos", true], ["cabo_guia", true], ["isolamento", true], ["capacete", false]]],
  ["tombamento", "Tombamento de carga ou equipamento", ["NR-11"], [["insp_pre", true], ["isolamento", false], ["raio_giro", false], ["rigger", false]]],
  ["partes_moveis", "Contato com partes móveis", ["NR-12"], [["protecoes", true], ["insp_pre", true], ["dds", false]]],
  ["particulas", "Projeção de partículas", ["NR-06"], [["oculos", true], ["isolamento", false]]],
  ["ruido", "Exposição a ruído", ["NR-15", "NR-09"], [["auricular", true], ["pausas", false]]],
  ["poeira", "Poeira mineral / sílica", ["NR-15", "NR-09"], [["pff2", true], ["corte_umido", false], ["oculos", false]]],
  ["ergonomia", "Sobrecarga ergonômica / levantamento manual", ["NR-17"], [["pausas", true], ["carrinho", false], ["argamassa", false], ["dds", false]]],
  ["incendio", "Incêndio / explosão", ["NR-18", "NR-23"], [["extintor", true], ["antichama", true], ["pt", true]]],
  ["queimadura", "Queimadura por calor ou fagulha", ["NR-18"], [["raspa", true], ["luvas_mec", true], ["masc_solda", false]]],
  ["radiacao", "Radiação não ionizante (arco de solda)", ["NR-15"], [["masc_solda", true], ["biombo", false]]],
  ["quimico", "Contato com produto químico (dermatite)", ["NR-15", "NR-09"], [["luvas_quim", true], ["fispq", true], ["creme", false]]],
  ["vapores", "Inalação de vapores e gases", ["NR-15"], [["resp_vapor", true], ["fispq", true], ["ventilacao", false]]],
  ["atropelamento", "Atropelamento por máquinas e veículos", ["NR-18", "NR-11"], [["colete", true], ["alarme_re", true], ["raio_giro", true], ["rigger", false]]],
  ["escorregao", "Escorregão e tropeço no mesmo nível", ["NR-18"], [["housekeeping", true], ["botina", true]]],
  ["corte", "Corte e perfuração por ferramentas", ["NR-06"], [["luvas_mec", true], ["insp_pre", false], ["oculos", false]]],
  ["calor", "Exposição ao calor e insolação", ["NR-15"], [["hidratacao", true], ["protetor_solar", false], ["pausas", false]]],
  ["colapso_andaime", "Colapso de andaime", ["NR-18", "NR-35"], [["andaime_ok", true], ["insp_pre", true], ["nr35", false], ["pt", false]]],
  ["desabamento", "Desabamento de estrutura ou escoramento", ["NR-18"], [["escoramento", true], ["isolamento", true], ["insp_pre", false]]],
  ["vibracao", "Exposição a vibração", ["NR-15", "NR-09"], [["pausas", true], ["luvas_vib", false]]],
  ["peconhentos", "Picada de animais peçonhentos", ["NR-18"], [["botina", true], ["primeiros_soc", true], ["luvas_mec", false]]],
  // Novos riscos
  ["queda_abertura", "Queda em aberturas, shafts ou bordas desprotegidas", ["NR-18", "NR-35"], [["protecao_aberturas", true], ["isolamento", true], ["guarda_corpo", false], ["pt", false]]],
  ["perf_vergalhao", "Perfuração ou impacto em pontas de vergalhões", ["NR-18", "NR-06"], [["protecao_vergalhao", true], ["botina", true], ["isolamento", false]]],
  ["esmagamento", "Esmagamento entre materiais, estruturas ou equipamentos", ["NR-11", "NR-18"], [["isolamento", true], ["comunicacao", true], ["rigger", false], ["insp_pre", false]]],
  ["rede_enterrada", "Dano ou contato com rede elétrica ou tubulação enterrada", ["NR-10", "NR-18"], [["rede_subterranea", true], ["plano_escavacao", true], ["isolamento", false], ["pt", false]]],
  ["queda_escada", "Queda durante uso de escada portátil", ["NR-18", "NR-35"], [["escada_inspecionada", true], ["isolamento", false], ["pta", false], ["nr35", false]]],
  ["projecao_fagulhas", "Projeção de fagulhas ou fragmentos durante corte e desbaste", ["NR-06", "NR-12"], [["oculos", true], ["isolamento", true], ["insp_pre", false], ["antichama", false]]],
  ["poeira_concreto", "Exposição a poeira durante corte, perfuração ou demolição de concreto", ["NR-09", "NR-15"], [["corte_umido", false], ["aspiracao_po", false], ["pff2", false], ["oculos", false]]],
  ["contaminacao_biologica", "Contato com esgoto, água contaminada ou resíduos biológicos", ["NR-09", "NR-15", "NR-18"], [["luvas_quim", false], ["higiene_maos", true], ["higiene_saneamento", false], ["primeiros_soc", false]]],
  ["fadiga_calor", "Fadiga ou mal-estar associado ao calor e esforço físico", ["NR-09", "NR-15", "NR-17"], [["hidratacao", true], ["pausa_calor", false], ["pausas", false], ["protetor_solar", false]]],
  ["iluminacao_insuf", "Iluminação insuficiente na frente de trabalho", ["NR-17", "NR-18"], [["iluminacao", true], ["isolamento", false], ["dds", false]]],
  ["falha_ferramenta", "Acidente por ferramenta inadequada, danificada ou improvisada", ["NR-12", "NR-18"], [["ferramenta_correta", true], ["inspecao_ferramentas", true], ["insp_pre", false]]],
  ["sobrecarga_repetitiva", "Sobrecarga por postura forçada ou movimentos repetitivos", ["NR-17"], [["ergonomia_postos", false], ["levantamento_mecanico", false], ["pausas", false], ["carrinho", false]]],
  ["colisao_veiculo", "Colisão entre veículos ou equipamentos móveis no canteiro", ["NR-11", "NR-18"], [["rota_pedestre", true], ["sinalizacao_transito", true], ["alarme_re", false], ["comunicacao", false]]],
  ["queda_carga_descarga", "Queda ou deslocamento de materiais durante carga e descarga", ["NR-11", "NR-18"], [["rigger", false], ["insp_cabos", false], ["isolamento", true], ["comunicacao", false]]],
];

type AR = [string, Probabilidade, Severidade];
type AtividadeSeed = [nome: string, categoria: string, descricao: string, termos: string[], riscos: AR[]];
const ATIVIDADES: AtividadeSeed[] = [
  ["Montagem e desmontagem de andaime fachadeiro", "Acesso e altura", "Montagem, ajuste e retirada de andaimes tubulares em fachadas.", ["andaime", "montar andaime", "desmontar andaime", "fachadeiro", "andaime tubular", "andaime metálico"], [["queda_alt", "alta", "grave"], ["queda_mat", "media", "grave"], ["colapso_andaime", "media", "grave"], ["ergonomia", "media", "moderada"]]],
  ["Trabalho em telhado e cobertura", "Acesso e altura", "Instalação, manutenção e limpeza de telhas, calhas e rufos.", ["telhado", "cobertura", "telha", "calha", "rufo", "cumeeira"], [["queda_alt", "alta", "grave"], ["queda_mat", "media", "moderada"], ["calor", "media", "moderada"], ["escorregao", "media", "moderada"]]],
  ["Escavação manual de valas", "Movimentação de terra", "Abertura manual de valas para fundações e redes enterradas.", ["escavação", "escavar", "vala", "cavar", "abrir vala", "fundação", "sapata", "baldrame"], [["soterramento", "media", "grave"], ["ergonomia", "alta", "moderada"], ["escorregao", "media", "leve"], ["peconhentos", "baixa", "moderada"], ["calor", "media", "moderada"]]],
  ["Escavação mecanizada e terraplenagem", "Movimentação de terra", "Escavação com retroescavadeira/escavadeira e movimentação de solo.", ["retroescavadeira", "escavadeira", "escavação mecânica", "terraplenagem", "corte de talude", "aterro", "máquina"], [["soterramento", "media", "grave"], ["atropelamento", "media", "grave"], ["tombamento", "baixa", "grave"], ["ruido", "media", "leve"], ["poeira", "media", "moderada"]]],
  ["Concretagem de laje", "Estrutura", "Lançamento, adensamento e acabamento de concreto em lajes.", ["concretagem", "concreto", "bomba de concreto", "lançamento de concreto", "laje", "concretar", "vibrador"], [["queda_alt", "media", "grave"], ["quimico", "media", "moderada"], ["ergonomia", "alta", "moderada"], ["escorregao", "media", "moderada"], ["desabamento", "baixa", "grave"]]],
  ["Armação de ferragem", "Estrutura", "Corte, dobra e montagem de armaduras de aço.", ["armação", "ferragem", "armar", "vergalhão", "aço", "corte e dobra", "armador", "estribo"], [["corte", "alta", "moderada"], ["particulas", "media", "moderada"], ["ergonomia", "media", "moderada"], ["escorregao", "media", "leve"]]],
  ["Montagem de formas e escoramento", "Estrutura", "Fabricação e montagem de fôrmas de madeira e cimbramento.", ["forma", "fôrma", "madeira", "escoramento", "cimbramento", "carpintaria", "carpinteiro", "desforma"], [["partes_moveis", "media", "grave"], ["particulas", "media", "moderada"], ["corte", "media", "moderada"], ["desabamento", "baixa", "grave"], ["queda_mat", "media", "moderada"]]],
  ["Alvenaria de vedação", "Vedação e revestimento", "Assentamento de blocos e tijolos para paredes.", ["alvenaria", "assentar bloco", "bloco", "tijolo", "parede", "levantar parede", "pedreiro"], [["ergonomia", "alta", "moderada"], ["quimico", "media", "leve"], ["escorregao", "media", "leve"], ["queda_alt", "media", "moderada"]]],
  ["Reboco, emboço e chapisco", "Vedação e revestimento", "Aplicação de revestimentos argamassados em paredes e tetos.", ["reboco", "emboço", "chapisco", "revestimento argamassado", "massa", "rebocar", "argamassa"], [["quimico", "media", "moderada"], ["ergonomia", "media", "moderada"], ["queda_alt", "media", "moderada"], ["particulas", "media", "leve"]]],
  ["Instalações elétricas de baixa tensão", "Instalações", "Passagem de eletrodutos, cabeamento e montagem de quadros desenergizados.", ["elétrica", "eletricista", "quadro elétrico", "cabeamento", "passar fiação", "fiação", "tomada", "disjuntor", "eletroduto", "luminária"], [["choque", "media", "grave"], ["arco", "baixa", "grave"], ["queda_alt", "media", "moderada"], ["corte", "media", "leve"]]],
  ["Intervenção em painel ou circuito energizado", "Instalações", "Medições, manutenção e manobras em instalações energizadas.", ["energizado", "manutenção elétrica", "painel energizado", "medição de tensão", "manobra", "subestação"], [["choque", "alta", "grave"], ["arco", "media", "grave"]]],
  ["Instalações hidrossanitárias", "Instalações", "Montagem de tubulações de água, esgoto e drenagem.", ["hidráulica", "encanador", "tubulação", "esgoto", "água", "pvc", "cola pvc", "registro", "ramal"], [["vapores", "media", "leve"], ["corte", "media", "leve"], ["ergonomia", "media", "moderada"], ["escorregao", "media", "leve"]]],
  ["Solda elétrica e oxicorte", "Trabalho a quente", "Soldagem com eletrodo revestido e corte com maçarico.", ["solda", "soldar", "oxicorte", "maçarico", "eletrodo", "corte a quente", "trabalho a quente", "soldador", "esmerilhadeira"], [["queimadura", "alta", "moderada"], ["incendio", "media", "grave"], ["radiacao", "alta", "moderada"], ["vapores", "media", "moderada"], ["choque", "baixa", "grave"]]],
  ["Pintura interna e externa", "Acabamento", "Preparação de superfície, lixamento e aplicação de tintas.", ["pintura", "pintar", "tinta", "solvente", "textura", "lixamento", "pintor", "selador"], [["vapores", "media", "moderada"], ["quimico", "media", "leve"], ["queda_alt", "media", "grave"], ["poeira", "media", "leve"]]],
  ["Içamento e movimentação de cargas", "Movimentação de cargas", "Içamento com guindaste, grua ou munck.", ["içamento", "içar", "guindaste", "grua", "munck", "carga suspensa", "movimentação de carga", "descarga", "descarregar caminhão"], [["esmag_carga", "media", "grave"], ["tombamento", "baixa", "grave"], ["queda_mat", "media", "grave"], ["atropelamento", "baixa", "grave"]]],
  ["Operação de serra circular de bancada", "Máquinas e equipamentos", "Corte de madeira em serra de bancada.", ["serra circular", "serra de bancada", "cortar madeira", "serrar", "serra"], [["partes_moveis", "alta", "grave"], ["particulas", "alta", "moderada"], ["ruido", "alta", "leve"], ["corte", "media", "grave"]]],
  ["Operação de betoneira", "Máquinas e equipamentos", "Preparo de argamassa e concreto em betoneira.", ["betoneira", "preparo de argamassa", "misturar concreto", "traço"], [["partes_moveis", "media", "grave"], ["choque", "media", "grave"], ["poeira", "media", "moderada"], ["ergonomia", "media", "moderada"]]],
  ["Trabalho em espaço confinado", "Espaço confinado", "Entrada em poços, caixas, galerias, tanques e cisternas.", ["espaço confinado", "poço", "caixa de inspeção", "galeria", "tanque", "cisterna", "reservatório", "caixa d'água", "PV"], [["atmosfera", "media", "grave"], ["soterramento", "baixa", "grave"], ["choque", "baixa", "grave"]]],
  ["Demolição manual", "Demolição", "Remoção de alvenarias e revestimentos com ferramentas manuais e rompedor.", ["demolição", "demolir", "quebrar parede", "rompedor", "martelete", "remoção de revestimento", "retirada de piso"], [["desabamento", "media", "grave"], ["poeira", "alta", "moderada"], ["ruido", "alta", "leve"], ["vibracao", "media", "moderada"], ["particulas", "alta", "moderada"], ["queda_mat", "media", "moderada"]]],
  ["Corte de piso e concreto com serra", "Máquinas e equipamentos", "Corte com serra clipper / disco diamantado.", ["corte de piso", "serra clipper", "disco diamantado", "cortar concreto", "makita", "corte de concreto", "policorte"], [["poeira", "alta", "moderada"], ["ruido", "alta", "leve"], ["particulas", "alta", "moderada"], ["partes_moveis", "media", "grave"], ["choque", "baixa", "grave"]]],
  ["Instalação de esquadrias e vidros", "Acabamento", "Fixação de caixilhos, portas, janelas e vidros.", ["esquadria", "janela", "vidro", "porta", "caixilho", "instalação de vidro", "vidraceiro"], [["corte", "media", "grave"], ["queda_alt", "media", "grave"], ["ergonomia", "media", "moderada"], ["queda_mat", "media", "moderada"]]],
  ["Impermeabilização com manta asfáltica", "Impermeabilização", "Aplicação de primer e manta asfáltica com maçarico.", ["impermeabilização", "manta asfáltica", "impermeabilizar", "primer", "manta", "maçarico"], [["queimadura", "media", "moderada"], ["incendio", "media", "grave"], ["vapores", "media", "moderada"], ["calor", "media", "moderada"], ["queda_alt", "media", "grave"]]],
  ["Trabalho em plataforma elevatória (PTA)", "Acesso e altura", "Uso de plataforma tesoura ou articulada.", ["plataforma elevatória", "pta", "tesoura", "articulada", "cesto", "plataforma"], [["queda_alt", "media", "grave"], ["tombamento", "baixa", "grave"], ["choque", "baixa", "grave"], ["queda_mat", "media", "moderada"]]],
  ["Limpeza e organização do canteiro", "Apoio", "Remoção de entulho, varrição e organização de materiais.", ["limpeza", "organização", "entulho", "caçamba", "varrer", "housekeeping", "limpar"], [["corte", "media", "leve"], ["poeira", "media", "leve"], ["ergonomia", "media", "moderada"], ["peconhentos", "baixa", "moderada"], ["escorregao", "media", "leve"]]],
  ["Instalação de forro de gesso e drywall", "Acabamento", "Montagem de perfis e placas de gesso acartonado.", ["forro", "gesso", "drywall", "placa", "perfil", "parafusadeira", "gesseiro"], [["queda_alt", "media", "moderada"], ["poeira", "media", "leve"], ["particulas", "media", "leve"], ["ergonomia", "media", "moderada"]]],
  ["Assentamento de piso e revestimento cerâmico", "Acabamento", "Assentamento de cerâmica, porcelanato e rejuntamento.", ["piso", "cerâmica", "porcelanato", "azulejo", "rejunte", "assentar piso", "azulejista"], [["ergonomia", "alta", "moderada"], ["quimico", "media", "leve"], ["particulas", "media", "moderada"], ["poeira", "media", "leve"], ["escorregao", "media", "leve"]]],
  ["Manuseio de produtos químicos", "Produtos químicos", "Uso de desmoldantes, aditivos, resinas e solventes.", ["químico", "desmoldante", "aditivo", "resina", "epóxi", "solvente", "produto químico"], [["quimico", "alta", "moderada"], ["vapores", "media", "moderada"], ["incendio", "baixa", "grave"]]],
  ["Montagem de estrutura metálica", "Estrutura", "Içamento e fixação de vigas e perfis metálicos.", ["estrutura metálica", "viga metálica", "perfil metálico", "parafusar estrutura", "montagem metálica", "montador"], [["queda_alt", "alta", "grave"], ["esmag_carga", "media", "grave"], ["queda_mat", "media", "grave"], ["queimadura", "baixa", "moderada"], ["ergonomia", "media", "moderada"]]],
  // Novas atividades
  ["Perfuração de lajes e paredes", "Demolição e perfuração", "Perfuração para passagens, fixações e instalações em elementos de concreto ou alvenaria.", ["furar laje", "furar parede", "perfuratriz", "martelete perfurador", "furo em concreto", "passagem de tubulação"], [["poeira_concreto", "media", "moderada"], ["falha_ferramenta", "media", "grave"], ["particulas", "media", "moderada"], ["choque", "baixa", "grave"], ["queda_abertura", "media", "grave"]]],
  ["Corte e desbaste com esmerilhadeira", "Máquinas e equipamentos", "Corte, desbaste e acabamento de peças com esmerilhadeira.", ["esmerilhadeira", "lixadeira angular", "desbaste", "cortar metal", "disco de corte"], [["projecao_fagulhas", "media", "moderada"], ["falha_ferramenta", "media", "grave"], ["corte", "media", "grave"], ["incendio", "baixa", "grave"], ["ruido", "media", "leve"]]],
  ["Uso de escada portátil", "Acesso e altura", "Acesso temporário a pontos de trabalho por escada portátil.", ["escada", "escada portátil", "escada extensível", "subir escada", "trabalho com escada"], [["queda_escada", "media", "grave"], ["queda_mat", "media", "moderada"], ["ergonomia", "media", "moderada"]]],
  ["Trabalho em bordas, shafts e aberturas", "Acesso e altura", "Atividades próximas a bordas, vãos, shafts ou aberturas em pisos.", ["shaft", "abertura no piso", "vão", "borda de laje", "periferia", "poço de elevador"], [["queda_abertura", "media", "grave"], ["queda_mat", "media", "moderada"], ["escorregao", "media", "moderada"]]],
  ["Montagem de armadura em laje", "Estrutura", "Posicionamento e amarração de armaduras em lajes e vigas.", ["armadura de laje", "armação de laje", "amarração de ferro", "vergalhão exposto", "montagem de ferragem"], [["perf_vergalhao", "media", "moderada"], ["queda_abertura", "media", "grave"], ["ergonomia", "alta", "moderada"], ["queda_mat", "media", "moderada"]]],
  ["Escavação próxima a redes enterradas", "Movimentação de terra", "Escavação manual ou mecanizada em área com possível presença de redes enterradas.", ["rede enterrada", "tubulação enterrada", "cabo subterrâneo", "escavar perto de rede", "interferência subterrânea"], [["rede_enterrada", "media", "grave"], ["soterramento", "media", "grave"], ["atropelamento", "media", "grave"], ["poeira", "media", "moderada"]]],
  ["Carga e descarga de materiais", "Movimentação de cargas", "Recebimento, descarga e distribuição de materiais no canteiro.", ["carga e descarga", "descarregar material", "recebimento de material", "descarga de caminhão", "entrega de material"], [["queda_carga_descarga", "media", "grave"], ["esmagamento", "media", "grave"], ["colisao_veiculo", "media", "grave"], ["ergonomia", "media", "moderada"]]],
  ["Movimentação de materiais com carrinho", "Movimentação de cargas", "Transporte de materiais por carrinhos e equipamentos manuais.", ["carrinho de mão", "carrinho plataforma", "transportar material", "movimentar blocos", "transporte manual"], [["sobrecarga_repetitiva", "media", "moderada"], ["esmagamento", "baixa", "moderada"], ["escorregao", "media", "leve"]]],
  ["Limpeza de caixa de inspeção ou rede de esgoto", "Limpeza e manutenção", "Limpeza e manutenção de caixas, galerias ou redes com possível contato com efluentes.", ["limpar caixa de inspeção", "limpeza de esgoto", "rede de esgoto", "caixa de passagem", "efluente"], [["contaminacao_biologica", "media", "grave"], ["atmosfera", "baixa", "grave"], ["quimico", "media", "moderada"], ["escorregao", "media", "moderada"]]],
  ["Aplicação de rejunte, selantes e adesivos", "Acabamento", "Preparação e aplicação de rejuntes, selantes, adesivos e produtos de acabamento.", ["rejunte", "selante", "silicone", "adesivo", "cola", "massa de vedação"], [["quimico", "media", "moderada"], ["vapores", "media", "moderada"], ["ergonomia", "media", "moderada"], ["escorregao", "media", "leve"]]],
  ["Instalação de luminárias e equipamentos no teto", "Instalações", "Fixação de luminárias, suportes e equipamentos em tetos ou forros.", ["instalar luminária", "luminária", "equipamento no teto", "fixação no teto", "trabalho sobre forro"], [["queda_alt", "media", "grave"], ["queda_escada", "media", "grave"], ["choque", "media", "grave"], ["queda_mat", "media", "moderada"]]],
  ["Trabalho noturno ou em área pouco iluminada", "Apoio", "Execução de serviços em período noturno ou em locais com iluminação limitada.", ["trabalho noturno", "área escura", "pouca iluminação", "iluminação provisória", "turno noturno"], [["iluminacao_insuf", "media", "moderada"], ["escorregao", "media", "moderada"], ["colisao_veiculo", "baixa", "grave"]]],
  ["Operação de rompedor elétrico ou pneumático", "Máquinas e equipamentos", "Demolição localizada ou remoção de concreto e alvenaria com rompedor.", ["rompedor", "martelete rompedor", "demolição localizada", "quebrar concreto", "quebrar piso"], [["vibracao", "media", "moderada"], ["ruido", "alta", "leve"], ["poeira_concreto", "alta", "moderada"], ["particulas", "media", "moderada"], ["falha_ferramenta", "media", "grave"]]],
  ["Trabalho em área de circulação de veículos", "Logística de canteiro", "Atividades próximas a vias internas, acessos, manobras e circulação de máquinas.", ["tráfego de obra", "via interna", "manobra de caminhão", "circulação de máquinas", "área de veículos"], [["colisao_veiculo", "media", "grave"], ["atropelamento", "media", "grave"], ["queda_mat", "baixa", "moderada"]]],
];

async function seedTudo() {
  await db.transaction(async (tx) => {
    // Usuários
    const [uColab, uAdmin, uAprov] = await tx
      .insert(usuarios)
      .values([
        { nome: "Carlos Andrade", email: "carlos.andrade@fvelloso.com.br", cargo: "Encarregado de obra", perfil: "colaborador" },
        { nome: "Mariana Souza", email: "mariana.souza@fvelloso.com.br", cargo: "Técnica de Segurança do Trabalho", perfil: "admin_sst" },
        { nome: "Roberto Lima", email: "roberto.lima@fvelloso.com.br", cargo: "Engenheiro de Segurança", perfil: "aprovador" },
      ])
      .returning();

    // Obras
    const [obra1, obra2] = await tx
      .insert(obras)
      .values([
        { codigo: "OB-001", nome: "Residencial Vista Verde", endereco: "Av. das Palmeiras, 1200 – Campinas/SP" },
        { codigo: "OB-002", nome: "Galpão Logístico Norte", endereco: "Rod. Anhanguera, km 98 – Jundiaí/SP" },
        { codigo: "OB-003", nome: "Reforma Escola Municipal Anísio Teixeira", endereco: "Rua das Acácias, 45 – Sorocaba/SP" },
      ])
      .returning();

    // NRs
    const nrRows = await tx.insert(nrs).values(NRS.map(([codigo, descricao]) => ({ codigo, descricao }))).returning();
    const nrId = new Map(nrRows.map((n) => [n.codigo, n.id]));

    // Controles
    const ctrlRows = await tx
      .insert(medidasControle)
      .values(CONTROLES.map(([, nome, tipoControle, descricao]) => ({ nome, tipoControle, descricao: descricao ?? null })))
      .returning();
    const ctrlId = new Map(CONTROLES.map(([key], i) => [key, ctrlRows[i].id]));

    // Riscos
    const riscoRows = await tx
      .insert(riscos)
      .values(RISCOS.map(([, nome, , , descricao]) => ({ nome, descricao: descricao ?? null })))
      .returning();
    const riscoId = new Map(RISCOS.map(([key], i) => [key, riscoRows[i].id]));

    const rnValues: { riscoId: number; nrId: number }[] = [];
    const rcValues: { riscoId: number; controleId: number; obrigatorio: boolean }[] = [];
    for (const [key, , nrCodes, ctrls] of RISCOS) {
      const rid = riscoId.get(key)!;
      for (const c of nrCodes) rnValues.push({ riscoId: rid, nrId: nrId.get(c)! });
      for (const [ck, obrig] of ctrls) rcValues.push({ riscoId: rid, controleId: ctrlId.get(ck)!, obrigatorio: obrig });
    }
    await tx.insert(riscoNr).values(rnValues);
    await tx.insert(riscoControle).values(rcValues);

    // Atividades
    const atvRows = await tx
      .insert(atividades)
      .values(ATIVIDADES.map(([nome, categoria, descricao]) => ({ nome, categoria, descricao })))
      .returning();
    const termoValues: { atividadeId: number; termo: string }[] = [];
    const arValues: { atividadeId: number; riscoId: number; probabilidade: string; severidade: string }[] = [];
    ATIVIDADES.forEach(([, , , termos, rs], i) => {
      const aid = atvRows[i].id;
      for (const t of termos) termoValues.push({ atividadeId: aid, termo: t });
      for (const [rk, p, s] of rs) arValues.push({ atividadeId: aid, riscoId: riscoId.get(rk)!, probabilidade: p, severidade: s });
    });
    await tx.insert(atividadeTermos).values(termoValues);
    await tx.insert(atividadeRisco).values(arValues);

    // APRs de exemplo (histórico)
    const ano = new Date().getFullYear();
    const [aprAprovada] = await tx
      .insert(apr)
      .values({
        codigo: `APR-${ano}-0001`,
        obraId: obra1.id,
        localObra: "Torre A – 5º pavimento",
        responsavel: "Carlos Andrade",
        equipe: "José, Antônio, Marcos (3 montadores)",
        dataExecucao: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
        descricaoServico: "Montagem de andaime fachadeiro na face norte da Torre A para execução de reboco externo.",
        status: "aprovada",
        etapaAtual: 4,
        revisadaPeloAutor: true,
        criadoPor: uColab.id,
        aprovadoPor: uAprov.id,
        submetidoEm: new Date(Date.now() - 6 * 86400000),
        aprovadoEm: new Date(Date.now() - 5 * 86400000),
        criadoEm: new Date(Date.now() - 7 * 86400000),
        atualizadoEm: new Date(Date.now() - 5 * 86400000),
      })
      .returning();
    const [aa1] = await tx
      .insert(aprAtividade)
      .values({ aprId: aprAprovada.id, ordem: 0, atividadeNomeSnapshot: ATIVIDADES[0][0], atividadeCategoriaSnapshot: ATIVIDADES[0][1], atividadeOrigemId: atvRows[0].id, origem: "base" })
      .returning();
    const [ar1] = await tx
      .insert(aprRisco)
      .values([
        { aprAtividadeId: aa1.id, riscoNomeSnapshot: "Queda de altura", nrsSnapshot: "NR-35, NR-18", probabilidade: "alta", severidade: "grave", revisado: true, riscoOrigemId: riscoId.get("queda_alt")!, origem: "base" },
        { aprAtividadeId: aa1.id, riscoNomeSnapshot: "Queda de materiais e objetos", nrsSnapshot: "NR-18", probabilidade: "media", severidade: "grave", revisado: true, riscoOrigemId: riscoId.get("queda_mat")!, origem: "base" },
      ])
      .returning();
    await tx.insert(aprControle).values([
      { aprRiscoId: ar1.id, controleNomeSnapshot: "Cinto de segurança tipo paraquedista com talabarte duplo", tipoControleSnapshot: "epi", obrigatorio: true, selecionado: true, controleOrigemId: ctrlId.get("cinto")!, origem: "base" },
      { aprRiscoId: ar1.id, controleNomeSnapshot: "Linha de vida ancorada em ponto certificado", tipoControleSnapshot: "engenharia", obrigatorio: true, selecionado: true, controleOrigemId: ctrlId.get("linha_vida")!, origem: "base" },
      { aprRiscoId: ar1.id, controleNomeSnapshot: "Treinamento NR-35 válido e ASO com aptidão para altura", tipoControleSnapshot: "administrativo", obrigatorio: true, selecionado: true, controleOrigemId: ctrlId.get("nr35")!, origem: "base" },
      { aprRiscoId: ar1.id, controleNomeSnapshot: "Permissão de Trabalho (PT) emitida e assinada", tipoControleSnapshot: "administrativo", obrigatorio: true, selecionado: true, controleOrigemId: ctrlId.get("pt")!, origem: "base" },
    ]);

    const [aprPendente] = await tx.insert(apr).values({
      codigo: `APR-${ano}-0002`,
      obraId: obra2.id,
      localObra: "Galpão 2 – mezanino",
      responsavel: "Carlos Andrade",
      equipe: "Equipe elétrica (2 eletricistas)",
      dataExecucao: new Date().toISOString().slice(0, 10),
      descricaoServico: "Passagem de eletrodutos e cabeamento no mezanino do galpão 2, com uso de escada e plataforma.",
      status: "aguardando_aprovacao",
      etapaAtual: 4,
      revisadaPeloAutor: true,
      criadoPor: uColab.id,
      submetidoEm: new Date(Date.now() - 3600000),
      criadoEm: new Date(Date.now() - 2 * 86400000),
      atualizadoEm: new Date(Date.now() - 3600000),
    }).returning();
    const [aa2] = await tx
      .insert(aprAtividade)
      .values({ aprId: aprPendente.id, ordem: 0, atividadeNomeSnapshot: ATIVIDADES[9][0], atividadeCategoriaSnapshot: ATIVIDADES[9][1], atividadeOrigemId: atvRows[9].id, origem: "base" })
      .returning();
    const [ar2a, ar2b] = await tx
      .insert(aprRisco)
      .values([
        { aprAtividadeId: aa2.id, riscoNomeSnapshot: "Choque elétrico", nrsSnapshot: "NR-10", probabilidade: "media", severidade: "grave", revisado: true, riscoOrigemId: riscoId.get("choque")!, origem: "base" },
        { aprAtividadeId: aa2.id, riscoNomeSnapshot: "Queda de altura", nrsSnapshot: "NR-35, NR-18", probabilidade: "media", severidade: "moderada", revisado: true, riscoOrigemId: riscoId.get("queda_alt")!, origem: "base" },
      ])
      .returning();
    await tx.insert(aprControle).values([
      { aprRiscoId: ar2a.id, controleNomeSnapshot: "Bloqueio e etiquetagem (LOTO) do circuito", tipoControleSnapshot: "administrativo", obrigatorio: true, selecionado: true, controleOrigemId: ctrlId.get("loto")!, origem: "base" },
      { aprRiscoId: ar2a.id, controleNomeSnapshot: "Teste de ausência de tensão com detector", tipoControleSnapshot: "engenharia", obrigatorio: true, selecionado: true, controleOrigemId: ctrlId.get("detector")!, origem: "base" },
      { aprRiscoId: ar2a.id, controleNomeSnapshot: "Treinamento NR-10 válido", tipoControleSnapshot: "administrativo", obrigatorio: true, selecionado: true, controleOrigemId: ctrlId.get("nr10")!, origem: "base" },
      { aprRiscoId: ar2b.id, controleNomeSnapshot: "Uso de plataforma elevatória (PTA) em vez de escada", tipoControleSnapshot: "substituicao", obrigatorio: false, selecionado: true, controleOrigemId: ctrlId.get("pta")!, origem: "base" },
      { aprRiscoId: ar2b.id, controleNomeSnapshot: "Cinto de segurança tipo paraquedista com talabarte duplo", tipoControleSnapshot: "epi", obrigatorio: true, selecionado: true, controleOrigemId: ctrlId.get("cinto")!, origem: "base" },
    ]);
    void uAdmin;
  });
}

async function syncNovosItens() {
  await db.transaction(async (tx) => {
    // 1. Controles
    const existingCtrls = await tx
      .select({ id: medidasControle.id, nome: medidasControle.nome })
      .from(medidasControle);
    const ctrlNomeToId = new Map(existingCtrls.map((c) => [c.nome, c.id]));
    const ctrlKeyToId = new Map<string, number>();

    for (const [key, nome, tipoControle, descricao] of CONTROLES) {
      if (!ctrlNomeToId.has(nome)) {
        const [inserted] = await tx
          .insert(medidasControle)
          .values({ nome, tipoControle, descricao: descricao ?? null })
          .returning();
        ctrlNomeToId.set(nome, inserted.id);
        ctrlKeyToId.set(key, inserted.id);
      } else {
        ctrlKeyToId.set(key, ctrlNomeToId.get(nome)!);
      }
    }

    // 2. NRs
    const nrRows = await tx.select().from(nrs);
    const nrCodeToId = new Map(nrRows.map((n) => [n.codigo, n.id]));

    // 3. Riscos
    const existingRiscos = await tx.select({ id: riscos.id, nome: riscos.nome }).from(riscos);
    const riscoNomeToId = new Map(existingRiscos.map((r) => [r.nome, r.id]));
    const riscoKeyToId = new Map<string, number>();

    for (const [key, nome, nrCodes, ctrls, descricao] of RISCOS) {
      let rid = riscoNomeToId.get(nome);
      if (!rid) {
        const [inserted] = await tx
          .insert(riscos)
          .values({ nome, descricao: descricao ?? null })
          .returning();
        rid = inserted.id;
        riscoNomeToId.set(nome, rid);
        const rnValues = nrCodes
          .map((c) => ({ riscoId: rid!, nrId: nrCodeToId.get(c)! }))
          .filter((x) => Boolean(x.nrId));
        if (rnValues.length) await tx.insert(riscoNr).values(rnValues);
        const rcValues = ctrls
          .map(([ck, obrig]) => ({
            riscoId: rid!,
            controleId: ctrlKeyToId.get(ck)!,
            obrigatorio: obrig,
          }))
          .filter((x) => Boolean(x.controleId));
        if (rcValues.length) await tx.insert(riscoControle).values(rcValues);
      }
      riscoKeyToId.set(key, rid);
    }

    // 4. Atividades
    const existingAtvs = await tx.select({ id: atividades.id, nome: atividades.nome }).from(atividades);
    const atvNomeToId = new Map(existingAtvs.map((a) => [a.nome, a.id]));

    for (const [nome, categoria, descricao, termos, rs] of ATIVIDADES) {
      if (!atvNomeToId.has(nome)) {
        const [inserted] = await tx
          .insert(atividades)
          .values({ nome, categoria, descricao })
          .returning();
        const aid = inserted.id;
        atvNomeToId.set(nome, aid);
        if (termos.length) {
          await tx.insert(atividadeTermos).values(termos.map((termo) => ({ atividadeId: aid, termo })));
        }
        const arValues = rs
          .map(([rk, p, s]) => ({
            atividadeId: aid,
            riscoId: riscoKeyToId.get(rk)!,
            probabilidade: p,
            severidade: s,
          }))
          .filter((x) => Boolean(x.riscoId));
        if (arValues.length) {
          await tx.insert(atividadeRisco).values(arValues);
        }
      }
    }
  });
}
