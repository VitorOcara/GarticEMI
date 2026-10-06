import { NextResponse } from "next/server";
import { clearCanvas } from "@/lib/server/roomService";

type Params = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const body = (await request.json()) as { playerId?: string; round?: number };
    if (!body.playerId || body.round == null) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    await clearCanvas(code, body.playerId, body.round);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao limpar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
