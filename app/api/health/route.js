import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      { status: "error" },
      { status: 503 },
    );
  }
}