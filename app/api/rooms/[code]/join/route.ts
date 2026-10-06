import { NextResponse } from "next/server";
import { joinRoom } from "@/lib/server/roomService";

type Params = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const body = (await request.json()) as {
      playerName?: string;
      playerId?: string;
    };
    const playerName = body.playerName?.trim();
    const playerId = body.playerId?.trim();
    if (!playerName || !playerId) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const { room, player } = await joinRoom(code, playerName, playerId);
    return NextResponse.json({
      roomId: room.id,
      code: room.code,
      player,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao entrar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
