import { getRiskDistribution } from "@/modules/apr";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const obraIdStr = url.searchParams.get("obraId");
    const codigo = url.searchParams.get("codigo") || undefined;
    const nome = url.searchParams.get("nome") || undefined;
    const obraId = obraIdStr ? parseInt(obraIdStr, 10) : undefined;

    const distribution = await getRiskDistribution({ obraId, codigo, nome });
    return Response.json({ distribution });
  } catch (error) {
    console.error("API /api/apr/riscos-distribuicao error:", error);
    return Response.json({ error: "Falha ao obter distribuição de riscos" }, { status: 500 });
  }
}

