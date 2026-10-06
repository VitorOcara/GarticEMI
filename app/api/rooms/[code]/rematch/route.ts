import { NextResponse } from "next/server";
import { playAgain } from "@/lib/server/roomService";

type Params = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const body = (await request.json()) as { playerId?: string };
    if (!body.playerId) {
      return NextResponse.json({ error: "playerId obrigatório" }, { status: 400 });
    }
    await playAgain(code, body.playerId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao reiniciar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
