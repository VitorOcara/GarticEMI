import { NextResponse } from "next/server";
import { submitGuess } from "@/lib/server/roomService";

type Params = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const body = (await request.json()) as { playerId?: string; message?: string };
    if (!body.playerId || !body.message) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const row = await submitGuess(code, body.playerId, body.message);
    return NextResponse.json({ message: row });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao enviar palpite";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
