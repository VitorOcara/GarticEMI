import { NextResponse } from "next/server";
import { heartbeat } from "@/lib/server/roomService";

type Params = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { code } = await params;
    const body = (await request.json()) as { playerId?: string };
    if (!body.playerId) {
      return NextResponse.json({ error: "playerId obrigatório" }, { status: 400 });
    }
    await heartbeat(code, body.playerId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
