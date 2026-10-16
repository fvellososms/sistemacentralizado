import { NextResponse } from "next/server";
import { getProjects } from "@/modules/projects/server";

export async function GET() {
  try {
    const projectsList = await getProjects();
    return NextResponse.json({ projects: projectsList });
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
