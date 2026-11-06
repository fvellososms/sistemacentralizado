import { NextResponse } from "next/server";
import { getIntegrationsStatus } from "@/modules/workspace/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getIntegrationsStatus());
}
