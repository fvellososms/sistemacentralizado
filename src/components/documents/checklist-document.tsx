/**
 * "Lista de verificação pré-operacional": same layout as the document of the original tool
 * (FVCheck, by Davi Mello Ferreira in collaboration with FVelloso Consultoria em SMS). Sizes are the
 * original ones in centimeters. The logo in the header is the one of the project's client company.
 */

import React from "react";
import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { iconePublico, logoCandidatos, type RespostaInput } from "@/modules/checklists";
import { preparePhotoUrlForPdf } from "./template";
import type { PdfJob } from "./PdfDownloadButton";

const cm = 28.3465;
const PAGE_W = 841.89;
const MARGIN = 2 * cm;
const FRAME_PADDING = 6; // inner padding of the original layout frame
const HALF_LINE = 0.5; // the original centers the 1pt box on the content edge; here borders are inside it
const CONTENT_W = PAGE_W - 2 * MARGIN;
const PHOTO_W = CONTENT_W / 4 - 0.3 * cm;
const PHOTO_H = 6 * cm;
const AZUL = "#2b2b8f";
const AZUL_CLARO = "#dce6f2";
const CINZA_CLARO = "#f2f2f2";
const GRADE = "#999999";
const W_NUM = 1 * cm;
const W_SIMBOLO = 1.6 * cm;
const W_MARCA = 1.4 * cm;
const W_COMENTARIO = 5.5 * cm;

const s = StyleSheet.create({
  page: { paddingTop: MARGIN + FRAME_PADDING - HALF_LINE, paddingBottom: MARGIN + FRAME_PADDING, paddingHorizontal: MARGIN - HALF_LINE, fontFamily: "Helvetica", color: "#000000" },
  headerRow: { flexDirection: "row", height: 51, borderWidth: 1, borderColor: "#000000" },
  headerLogo: { width: 3.2 * cm - HALF_LINE, alignItems: "center", justifyContent: "center", padding: 4, borderRightWidth: 0.75, borderRightColor: "#000000" },
  headerLogoImage: { width: 2.8 * cm, height: 2.8 * cm * (90 / 219), objectFit: "contain" },
  headerTitle: { flex: 1, justifyContent: "center", paddingVertical: 4, paddingHorizontal: 6, borderRightWidth: 0.75, borderRightColor: "#000000" },
  title: { fontFamily: "Helvetica-Bold", fontSize: 13, lineHeight: 12 / 13, textAlign: "center", position: "relative", top: 1.2 },
  subtitle: { fontFamily: "Helvetica-Bold", fontSize: 12, lineHeight: 1, textAlign: "center", color: AZUL, position: "relative", top: 1.2 },
  headerDoc: { width: 4.8 * cm - HALF_LINE, justifyContent: "center", paddingLeft: 12 },
  docLine: { flexDirection: "row", height: 14, alignItems: "center", position: "relative", top: -1.1 },
  docLabel: { width: 1.6 * cm, fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  docValue: { flex: 1, fontSize: 7.5 },
  fieldRow: { flexDirection: "row", minHeight: 30, borderWidth: 1, borderTopWidth: 0, borderColor: "#000000" },
  field: { paddingTop: 4, paddingBottom: 3, paddingHorizontal: 6 },
  fieldLabel: { fontFamily: "Helvetica-Bold", fontSize: 7, lineHeight: 1.57, position: "relative", top: 0.2 },
  fieldValue: { fontSize: 9, lineHeight: 1.22, minHeight: 11, position: "relative", top: -1.6 },
  table: { marginTop: 0.4 * cm - 0.75 },
  headRow: { flexDirection: "row", minHeight: 21, backgroundColor: AZUL_CLARO, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#000000" },
  // Every row ends in the black line that closes the table; the next row covers it, so only the last row of each page keeps it.
  row: { flexDirection: "row", minHeight: 21, marginTop: -1, borderTopWidth: 0.5, borderTopColor: GRADE, borderBottomWidth: 1, borderBottomColor: "#000000", borderLeftWidth: 1, borderLeftColor: "#000000", borderRightWidth: 1, borderRightColor: "#000000" },
  cell: { paddingTop: 3.5, paddingBottom: 4, paddingHorizontal: 5, justifyContent: "center", borderRightWidth: 0.5, borderRightColor: GRADE },
  headText: { fontFamily: "Helvetica-Bold", fontSize: 9, textAlign: "center", position: "relative", top: -0.55 },
  num: { fontSize: 10, textAlign: "center", position: "relative", top: 0.7 },
  desc: { fontSize: 8.5, lineHeight: 1.294, position: "relative", top: 1.1 },
  comment: { fontSize: 8, lineHeight: 1.25, color: "#333333", position: "relative", top: 1.1 },
  mark: { fontFamily: "Helvetica-Bold", fontSize: 10, textAlign: "center", position: "relative", top: 0.7 },
  icon: { width: 0.75 * cm, height: 0.75 * cm, alignSelf: "center" },
  photosTitle: { fontFamily: "Helvetica-Bold", fontSize: 14, lineHeight: 1.286, marginLeft: FRAME_PADDING + HALF_LINE, marginTop: 0.4 * cm + 13.9, marginBottom: 3.4 + 0.2 * cm },
  photoGrid: { width: 4 * PHOTO_W + 1, alignSelf: "center", borderWidth: 1, borderColor: "#000000" },
  photoRow: { flexDirection: "row" },
  photoCell: { flex: 1, height: PHOTO_H, alignItems: "center", justifyContent: "center" },
  photoImage: { width: PHOTO_W - 0.4 * cm, height: PHOTO_H - 0.4 * cm, objectFit: "contain" },
  placeholder: { fontSize: 9, color: "#808080", textAlign: "center" },
  signatures: { marginTop: 0.6 * cm },
  signatureName: { fontSize: 10, lineHeight: 1.2, marginLeft: FRAME_PADDING + HALF_LINE, marginTop: 6 },
  signatureImage: { width: 7 * cm, height: 7 * cm * (150 / 400), alignSelf: "center" },
  pageNumber: { position: "absolute", right: MARGIN, bottom: 1.2 * cm - 1.6, fontSize: 8, color: "#808080" },
  watermarkLogo: { position: "absolute", left: MARGIN, bottom: 1 * cm, width: 2.6 * cm, height: 2.6 * cm * (327 / 1080), opacity: 0.35 },
  watermarkText: { position: "absolute", left: MARGIN + 2.85 * cm, bottom: 1.15 * cm - 1.5, fontFamily: "Helvetica-Oblique", fontSize: 7.5, color: AZUL },
});

export interface ChecklistPdfData {
  modeloNome: string;
  numero: string;
  revisao: string;
  dataInspecao: string; // YYYY-MM-DD
  contratada: string;
  subcontratada: string;
  local: string;
  grupo: string;
  frente: string;
  objeto: string;
  tag: string;
  periodicidade: string;
  nomeTecnico: string;
  nomeOperador: string;
  assinaturaTecnico: string | null;
  assinaturaOperador: string | null;
  empresaCliente: string | null;
  respostas: RespostaInput[];
  fotos: string[]; // data URLs
}

export interface ChecklistPdfImages {
  logoCliente: string | null;
  logoFvelloso: string | null;
  icones: Record<string, string>;
}

const dataBr = (iso: string) => iso.split("-").reverse().join("/");

function Campo({ rotulo, valor, largura, ultimo }: { rotulo: string; valor: string; largura?: number; ultimo?: boolean }) {
  return (
    <View style={[s.field, largura ? { width: largura, paddingLeft: 5.5 } : { flex: 1 }, ultimo ? {} : { borderRightWidth: 0.75, borderRightColor: "#000000" }]}>
      <Text style={s.fieldLabel}>{rotulo}:</Text>
      <Text style={s.fieldValue}>{valor || " "}</Text>
    </View>
  );
}

function Cabecalho({ d, img }: { d: ChecklistPdfData; img: ChecklistPdfImages }) {
  const lt = CONTENT_W;
  const primeira = (fracao: number) => lt * fracao - HALF_LINE;
  const linhas: [string, string][] = [
    ["NÚMERO:", d.numero],
    ["REVISÃO:", d.revisao],
    ["DATA:", dataBr(d.dataInspecao)],
  ];
  const logo = img.logoCliente ?? img.logoFvelloso;
  return (
    <View>
      <View style={s.headerRow}>
        <View style={s.headerLogo}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image has no alt */}
          {logo ? <Image src={logo} style={s.headerLogoImage} /> : <Text style={s.placeholder}>LOGO</Text>}
        </View>
        <View style={s.headerTitle}>
          <Text style={s.title}>LISTA DE VERIFICAÇÃO PRÉ-OPERACIONAL</Text>
          <Text style={s.subtitle}>{d.modeloNome.toUpperCase()}</Text>
        </View>
        <View style={s.headerDoc}>
          {linhas.map(([rotulo, valor]) => (
            <View key={rotulo} style={s.docLine}>
              <Text style={s.docLabel}>{rotulo}</Text>
              <Text style={s.docValue}>{valor}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={s.fieldRow}>
        <Campo rotulo="CONTRATADA" valor={d.contratada} largura={primeira(0.45)} />
        <Campo rotulo="SUBCONTRATADA" valor={d.subcontratada} ultimo />
      </View>
      <View style={s.fieldRow}>
        <Campo rotulo="LOCAL" valor={d.local} largura={primeira(0.4)} />
        <Campo rotulo="GRUPO" valor={d.grupo} largura={lt * 0.25} />
        <Campo rotulo="FRENTE DE SERVIÇO" valor={d.frente} ultimo />
      </View>
      <View style={s.fieldRow}>
        <Campo rotulo="OBJETO DA INSPEÇÃO" valor={d.objeto} largura={primeira(0.4)} />
        <Campo rotulo="IDENTIFICAÇÃO/TAG" valor={d.tag} largura={lt * 0.25} />
        <Campo rotulo="PERIODICIDADE DA INSPEÇÃO" valor={d.periodicidade} ultimo />
      </View>
    </View>
  );
}

function Marca({ ativa, cor, largura }: { ativa: boolean; cor: string; largura: number }) {
  return (
    <View style={[s.cell, { width: largura, paddingHorizontal: 2 }]}>
      <Text style={[s.mark, { color: cor }]}>{ativa ? "X" : " "}</Text>
    </View>
  );
}

/**
 * The stripes restart on each page (the first row of a page is white). Which row lands on which
 * page is only known after the layout, so the document is laid out once to measure it.
 */
function zebrado(paginas: number[] | undefined, total: number): boolean[] {
  const inicioDaPagina = new Map<number, number>();
  return Array.from({ length: total }, (_, i) => {
    const pagina = paginas?.[i] ?? 1;
    if (!inicioDaPagina.has(pagina)) inicioDaPagina.set(pagina, i);
    return (i - inicioDaPagina.get(pagina)!) % 2 === 1;
  });
}

function TabelaPerguntas({ d, img, paginas, medir }: { d: ChecklistPdfData; img: ChecklistPdfImages; paginas?: number[]; medir?: (linha: number, pagina: number) => void }) {
  const cinza = zebrado(paginas, d.respostas.length);
  const comSimbolo = d.respostas.some((r) => r.icone && img.icones[r.icone]);
  const larguraSimbolo = comSimbolo ? W_SIMBOLO : 0;
  const larguraDesc = CONTENT_W - W_NUM - larguraSimbolo - 3 * W_MARCA - W_COMENTARIO;
  const larguraNum = W_NUM - HALF_LINE;
  const larguraComentario = W_COMENTARIO - HALF_LINE;
  const titulos: [string, number][] = [
    ["Nº", larguraNum],
    ...(comSimbolo ? ([["Símbolo", W_SIMBOLO]] as [string, number][]) : []),
    ["Descrição", larguraDesc],
    ["C", W_MARCA],
    ["NC", W_MARCA],
    ["NA", W_MARCA],
    ["Comentário", larguraComentario],
  ];
  return (
    <View style={s.table}>
      <View style={s.headRow} fixed>
        {titulos.map(([t, w], i) => (
          <View key={t} style={[s.cell, { width: w }, i === titulos.length - 1 ? { borderRightWidth: 0 } : {}]}>
            <Text style={s.headText}>{t}</Text>
          </View>
        ))}
      </View>
      {d.respostas.map((r, i) => {
        const icone = r.icone ? img.icones[r.icone] : undefined;
        return (
          <View key={i} wrap={false} style={[s.row, { backgroundColor: cinza[i] ? CINZA_CLARO : "#ffffff" }]}>
            <View style={[s.cell, { width: larguraNum, paddingHorizontal: 2 }]}>
              {medir && <View render={({ pageNumber }) => { medir(i, pageNumber); return null; }} />}
              <Text style={s.num}>{i + 1}</Text>
            </View>
            {comSimbolo && (
              <View style={[s.cell, { width: W_SIMBOLO }]}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image has no alt */}
                {icone ? <Image src={icone} style={s.icon} /> : null}
              </View>
            )}
            <View style={[s.cell, { width: larguraDesc }]}>
              <Text style={s.desc}>{r.pergunta}</Text>
            </View>
            <Marca ativa={r.resposta === "Conforme"} cor="#1a7a1a" largura={W_MARCA} />
            <Marca ativa={r.resposta === "Não conforme"} cor="#c0392b" largura={W_MARCA} />
            <Marca ativa={r.resposta === "Não se aplica"} cor="#777777" largura={W_MARCA} />
            <View style={[s.cell, { width: larguraComentario, borderRightWidth: 0 }]}>
              {r.comentario ? <Text style={s.comment}>{r.comentario}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function GradeFotos({ fotos }: { fotos: string[] }) {
  const total = Math.max(4, fotos.length);
  const celulas = Array.from({ length: total }, (_, i) => fotos[i] ?? null);
  const linhas: (string | null)[][] = [];
  for (let i = 0; i < total; i += 4) linhas.push(celulas.slice(i, i + 4));
  const cabe = linhas.length <= 2; // the original keeps title and photos together when they fit in a page
  const titulo = <Text style={s.photosTitle} minPresenceAhead={PHOTO_H}>Fotos da inspeção</Text>;
  const grade = (
    <View style={s.photoGrid}>
      {linhas.map((linha, l) => (
        <View key={l} wrap={false} style={[s.photoRow, l > 0 ? { borderTopWidth: 1, borderTopColor: "#000000" } : {}]}>
          {Array.from({ length: 4 }, (_, c) => {
            const foto = linha[c];
            return (
              <View key={c} style={[s.photoCell, c < 3 ? { borderRightWidth: 1, borderRightColor: "#000000" } : {}]}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image has no alt */}
                {foto ? <Image src={foto} style={s.photoImage} /> : c < linha.length ? <Text style={s.placeholder}>Foto não anexada</Text> : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
  return cabe ? <View wrap={false}>{titulo}{grade}</View> : <View>{titulo}{grade}</View>;
}

function Assinatura({ rotulo, nome, imagem }: { rotulo: string; nome: string; imagem: string | null }) {
  return (
    <View>
      <Text style={s.signatureName}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>{rotulo}:</Text> {nome}
      </Text>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image has no alt */}
      {imagem ? <Image src={imagem} style={s.signatureImage} /> : null}
    </View>
  );
}

export function ChecklistDocument({ d, img, paginas, medir }: { d: ChecklistPdfData; img: ChecklistPdfImages; paginas?: number[]; medir?: (linha: number, pagina: number) => void }) {
  return (
    <Document title={`Inspeção ${d.modeloNome}`} author="FVelloso Consultoria em SMS">
      <Page size="A4" orientation="landscape" style={s.page}>
        <Cabecalho d={d} img={img} />
        <TabelaPerguntas d={d} img={img} paginas={paginas} medir={medir} />
        {d.fotos.length > 0 && <GradeFotos fotos={d.fotos} />}
        <View wrap={false} style={s.signatures}>
          <Assinatura rotulo="Técnico responsável" nome={d.nomeTecnico} imagem={d.assinaturaTecnico} />
          <View style={{ height: 0.4 * cm }} />
          <Assinatura rotulo="Operador presente" nome={d.nomeOperador} imagem={d.assinaturaOperador} />
        </View>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image has no alt */}
        {img.logoFvelloso ? <Image fixed src={img.logoFvelloso} style={s.watermarkLogo} /> : null}
        <Text fixed style={s.watermarkText}>Desenvolvido por FVelloso Consultoria em SMS</Text>
        <Text fixed style={s.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </Page>
    </Document>
  );
}

/** Image from the site as a data URL, or null when it does not exist. */
async function imagemDoSite(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const tipo = res.headers.get("content-type") ?? "";
    if (!res.ok || !tipo.startsWith("image/")) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function primeiraImagem(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    const imagem = await imagemDoSite(url);
    if (imagem) return imagem;
  }
  return null;
}

/** Page of each row, from a first layout of the document. */
export async function medirPaginas(d: ChecklistPdfData, img: ChecklistPdfImages): Promise<number[]> {
  const paginas: number[] = [];
  await pdf(<ChecklistDocument d={d} img={img} medir={(linha, pagina) => (paginas[linha] = pagina)} />).toBuffer();
  return paginas;
}

export async function buildChecklistPdf(d: ChecklistPdfData): Promise<PdfJob> {
  const nomesIcones = [...new Set(d.respostas.flatMap((r) => (r.icone ? [r.icone] : [])))];
  const [logoCliente, logoFvelloso, listaIcones, fotos] = await Promise.all([
    primeiraImagem(logoCandidatos(d.empresaCliente)),
    imagemDoSite("/checklist/fvelloso_logo.jpg"),
    Promise.all(nomesIcones.map(async (nome) => [nome, await imagemDoSite(iconePublico(nome))] as const)),
    Promise.all(d.fotos.map((f) => preparePhotoUrlForPdf(f))),
  ]);
  const icones = Object.fromEntries(listaIcones.filter((par): par is readonly [string, string] => Boolean(par[1])));
  const carimbo = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).slice(0, 16).replace(" ", "_").replace(":", "-");
  const dados = { ...d, fotos: fotos.filter((f): f is string => Boolean(f)) };
  const imagens = { logoCliente, logoFvelloso, icones };
  const paginas = await medirPaginas(dados, imagens);
  return {
    document: <ChecklistDocument d={dados} img={imagens} paginas={paginas} />,
    fileName: `inspecao_${d.modeloNome}_${carimbo}.pdf`,
  };
}

/** Loads a saved inspection (with its photos) and builds the PDF. */
export async function fetchChecklistPdf(id: number): Promise<PdfJob> {
  const res = await fetch(`/api/qualidade/checklists/inspecoes/${id}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.inspecao) throw new Error(data.error || "Inspeção não encontrada.");
  const { fotos, ...inspecao } = data.inspecao as Omit<ChecklistPdfData, "fotos"> & { fotos: { id: number }[] };
  const urls = await Promise.all(fotos.map((f) => imagemDoSite(`/api/qualidade/checklists/inspecoes/${id}/fotos/${f.id}`)));
  return buildChecklistPdf({ ...inspecao, fotos: urls.filter((u): u is string => Boolean(u)) });
}
