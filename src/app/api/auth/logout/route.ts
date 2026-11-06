import { NextResponse } from "next/server";
import { clearSession } from "@/modules/users/server";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
