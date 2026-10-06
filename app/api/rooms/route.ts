import { NextResponse } from "next/server";
import { createRoom } from "@/lib/server/roomService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      playerName?: string;
      playerId?: string;
    };
    const playerName = body.playerName?.trim();
    const playerId = body.playerId?.trim();
    if (!playerName || !playerId) {
      return NextResponse.json(
        { error: "Nome e identificador do jogador são obrigatórios" },
        { status: 400 }
      );
    }
    const { room, player } = await createRoom(playerName, playerId);
    return NextResponse.json({
      code: room.code,
      roomId: room.id,
      player,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao criar sala";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
