import { NextResponse } from "next/server";
import { getRoomPublic, listPlayers } from "@/lib/server/roomService";

type Params = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const room = await getRoomPublic(code);
    if (!room) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }
    const players = await listPlayers(room.id);
    return NextResponse.json({ room, players });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
