import { NextResponse } from "next/server";
import { getProfile, updateProfile } from "@/modules/users/server";

export async function GET() {
  try {
    const profile = await getProfile();
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error in GET /api/profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateProfile(body);
    return NextResponse.json({
      profile: updated,
      message: "Perfil atualizado com sucesso!",
    });
  } catch (error) {
    console.error("Error in PUT /api/profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
