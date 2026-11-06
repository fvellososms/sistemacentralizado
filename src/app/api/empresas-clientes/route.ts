import { NextResponse } from "next/server";
import { listActiveClientCompanyNames } from "@/modules/clients/server";

export const dynamic = "force-dynamic";

/** Active client company names, used as suggestions in forms (any logged user). */
export async function GET() {
  return NextResponse.json({ companies: await listActiveClientCompanyNames() });
}
