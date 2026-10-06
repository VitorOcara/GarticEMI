import { NextResponse } from "next/server";
import { getDrawerWord } from "@/lib/server/roomService";

type Params = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");
    if (!playerId) {
      return NextResponse.json({ error: "playerId obrigatório" }, { status: 400 });
    }
    const word = await getDrawerWord(code, playerId);
    if (!word) {
      return NextResponse.json({ word: null });
    }
    return NextResponse.json({ word });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
