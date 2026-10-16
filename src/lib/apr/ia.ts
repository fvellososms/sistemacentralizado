/**
 * Interpretação opcional por IA generativa (RF19).
 * Só é usada quando OPENAI_API_KEY está configurada; do contrário, a decomposição
 * heurística em `search.ts` é utilizada. A IA apenas sugere trechos de atividades —
 * nunca decide o conteúdo da APR.
 */
export async function interpretarComIa(texto: string): Promise<string[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Você apoia a elaboração de APR em canteiro de obras no Brasil. Dada a descrição de um serviço, " +
              "liste as atividades distintas de construção civil mencionadas, em português, de forma curta (2 a 6 palavras cada). " +
              'Responda somente JSON no formato {"atividades": ["..."]}. Não invente atividades não mencionadas.',
          },
          { role: "user", content: texto.slice(0, 1500) },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as { atividades?: unknown };
    if (!Array.isArray(parsed.atividades)) return null;
    const lista = parsed.atividades.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    return lista.length ? lista.slice(0, 8) : null;
  } catch {
    return null;
  }
}
