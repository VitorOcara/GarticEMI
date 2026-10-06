import { NextResponse } from "next/server";
import { submitStroke } from "@/lib/server/roomService";
import type { Stroke } from "@/types/drawing";

type Params = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const body = (await request.json()) as {
      playerId?: string;
      stroke?: Stroke;
      round?: number;
    };
    if (!body.playerId || !body.stroke || body.round == null) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    await submitStroke(code, body.playerId, body.stroke, body.round);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao desenhar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
