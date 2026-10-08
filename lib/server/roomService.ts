import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateRoomCode, normalizeRoomCode } from "@/lib/room";
import { isRoundIntroActive } from "@/lib/game";
import { pickRandomWord, guessesMatch } from "@/lib/words";
import {
  pickDrawer,
  allGuessersFound,
  remainingSeconds,
} from "@/lib/game";
import {
  pointsForGuessOrder,
  DRAWER_POINTS_PER_CORRECT_GUESS,
} from "@/lib/scoring";
import type { Player } from "@/types/player";
import type { RoomPublic } from "@/types/room";
import type { Stroke } from "@/types/drawing";
import { DEFAULT_ROUND_DURATION_SECONDS } from "@/types/game";

async function getRoomByCode(code: string) {
  const supabase = getSupabaseAdmin();
  const normalized = normalizeRoomCode(code);
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", normalized)
    .single();
  if (error || !data) return null;
  return data;
}

/** Um mesmo id de jogador (navegador) só pode existir em uma sala por vez. */
async function releasePlayerFromOtherRoom(
  playerId: string,
  currentRoomId: string
) {
  const supabase = getSupabaseAdmin();
  const { data: prev } = await supabase
    .from("players")
    .select("room_id")
    .eq("id", playerId)
    .maybeSingle();

  if (!prev || prev.room_id === currentRoomId) return;

  const { data: prevRoom } = await supabase
    .from("rooms")
    .select("code")
    .eq("id", prev.room_id)
    .maybeSingle();

  if (prevRoom?.code) {
    await leaveRoom(prevRoom.code, playerId);
  }

  await supabase.from("players").delete().eq("id", playerId);
}

export async function createRoom(hostName: string, hostPlayerId: string) {
  const supabase = getSupabaseAdmin();
  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
    code = generateRoomCode();
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      code,
      status: "waiting",
      round_duration: DEFAULT_ROUND_DURATION_SECONDS,
    })
    .select("id, code")
    .single();

  if (roomError || !room) {
    throw new Error(roomError?.message ?? "Não foi possível criar a sala");
  }

  await releasePlayerFromOtherRoom(hostPlayerId, room.id);

  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({
      id: hostPlayerId,
      room_id: room.id,
      name: hostName.trim(),
      is_host: true,
      connected: true,
    })
    .select("*")
    .single();

  if (playerError || !player) {
    throw new Error(playerError?.message ?? "Não foi possível criar o host");
  }

  await supabase.from("rooms").update({ host_id: player.id }).eq("id", room.id);

  return { room, player: player as Player };
}

export async function joinRoom(
  code: string,
  playerName: string,
  playerId: string
) {
  const supabase = getSupabaseAdmin();
  const room = await getRoomByCode(code);
  if (!room) throw new Error("Sala não encontrada");

  const { data: existing } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .eq("room_id", room.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("players")
      .update({ connected: true, name: playerName.trim() })
      .eq("id", playerId);
    const { data: updated } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .single();
    return { room, player: (updated ?? existing) as Player };
  }

  if (room.status === "finished") {
    throw new Error("Esta partida já terminou. Peça ao host para iniciar uma nova rodada.");
  }

  if (room.status === "playing") {
    throw new Error("Partida em andamento. Aguarde a próxima rodada ou crie outra sala.");
  }

  await releasePlayerFromOtherRoom(playerId, room.id);

  const { data: player, error } = await supabase
    .from("players")
    .insert({
      id: playerId,
      room_id: room.id,
      name: playerName.trim(),
      is_host: false,
      connected: true,
    })
    .select("*")
    .single();

  if (error || !player) {
    throw new Error(error?.message ?? "Não foi possível entrar na sala");
  }

  await insertSystemMessage(
    room.id,
    player.id,
    player.name,
    `${player.name} entrou na sala`
  );

  return { room, player: player as Player };
}

export async function leaveRoom(code: string, playerId: string) {
  const supabase = getSupabaseAdmin();
  const room = await getRoomByCode(code);
  if (!room) return;

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .eq("room_id", room.id)
    .maybeSingle();

  if (!player) return;

  await supabase
    .from("players")
    .update({ connected: false })
    .eq("id", playerId);

  await insertSystemMessage(room.id, playerId, player.name, `${player.name} saiu da sala`);

  if (player.is_host) {
    await transferHost(room.id, playerId);
  }

  if (room.status === "playing" && room.drawer_id === playerId) {
    await finishRoundEarly(room.id, "drawer_left");
  }
}

async function transferHost(roomId: string, leavingHostId: string) {
  const supabase = getSupabaseAdmin();
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .eq("connected", true)
    .neq("id", leavingHostId)
    .order("joined_at", { ascending: true });

  const next = players?.[0];
  if (!next) {
    await supabase.from("rooms").update({ host_id: null }).eq("id", roomId);
    return;
  }

  await supabase.from("players").update({ is_host: false }).eq("room_id", roomId);
  await supabase
    .from("players")
    .update({ is_host: true })
    .eq("id", next.id);
  await supabase.from("rooms").update({ host_id: next.id }).eq("id", roomId);

  await insertSystemMessage(
    roomId,
    next.id,
    next.name,
    `${next.name} agora é o host`
  );
}

export async function getRoomPublic(code: string): Promise<RoomPublic | null> {
  const supabase = getSupabaseAdmin();
  const normalized = normalizeRoomCode(code);
  const { data, error } = await supabase
    .from("rooms_public")
    .select("*")
    .eq("code", normalized)
    .single();
  if (error || !data) return null;
  return data as RoomPublic;
}

export async function listPlayers(roomId: string): Promise<Player[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });
  return (data ?? []) as Player[];
}

export async function playAgain(code: string, hostPlayerId: string) {
  const supabase = getSupabaseAdmin();
  const room = await getRoomByCode(code);
  if (!room) throw new Error("Sala não encontrada");
  if (room.host_id !== hostPlayerId) {
    throw new Error("Apenas o host pode iniciar uma nova partida");
  }
  if (room.status !== "finished") {
    throw new Error("A partida ainda não terminou");
  }

  await supabase.from("room_secrets").delete().eq("room_id", room.id);
  await supabase.from("drawing_strokes").delete().eq("room_id", room.id);

  await supabase
    .from("players")
    .update({ score: 0, guessed_this_round: false })
    .eq("room_id", room.id);

  await supabase
    .from("rooms")
    .update({
      status: "waiting",
      current_round: 0,
      total_rounds: 0,
      drawer_id: null,
      round_started_at: null,
    })
    .eq("id", room.id);

  await insertSystemMessage(
    room.id,
    hostPlayerId,
    "Sistema",
    "Nova partida! Mesma sala — aguardando o host iniciar."
  );
}

export async function startGame(code: string, hostPlayerId: string) {
  const supabase = getSupabaseAdmin();
  const room = await getRoomByCode(code);
  if (!room) throw new Error("Sala não encontrada");
  if (room.host_id !== hostPlayerId) throw new Error("Apenas o host pode iniciar");
  if (room.status !== "waiting") throw new Error("A partida já foi iniciada");

  const players = await listPlayers(room.id);
  const connected = players.filter((p) => p.connected);
  if (connected.length < 2) {
    throw new Error("É necessário pelo menos 2 jogadores conectados");
  }

  const totalRounds = connected.length;
  await supabase
    .from("rooms")
    .update({
      status: "playing",
      total_rounds: totalRounds,
      current_round: 0,
    })
    .eq("id", room.id);

  await startNextRound(room.id, null);
}

async function startNextRound(roomId: string, previousDrawerId: string | null) {
  const supabase = getSupabaseAdmin();
  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room) return;

  const nextRound = room.current_round + 1;
  if (nextRound > room.total_rounds) {
    await supabase.from("room_secrets").delete().eq("room_id", roomId);
    await supabase
      .from("rooms")
      .update({ status: "finished", drawer_id: null })
      .eq("id", roomId);
    await insertSystemMessage(
      roomId,
      room.host_id ?? roomId,
      "Sistema",
      "Partida finalizada! Confira o placar."
    );
    return;
  }

  const players = await listPlayers(roomId);
  const drawer = pickDrawer(players, previousDrawerId);
  if (!drawer) {
    await supabase.from("rooms").update({ status: "finished" }).eq("id", roomId);
    return;
  }

  const word = pickRandomWord();
  const startedAt = new Date().toISOString();

  await supabase
    .from("players")
    .update({ guessed_this_round: false })
    .eq("room_id", roomId);

  await supabase.from("drawing_strokes").delete().eq("room_id", roomId);

  await supabase.from("room_secrets").upsert({ room_id: roomId, word });

  await supabase
    .from("rooms")
    .update({
      current_round: nextRound,
      drawer_id: drawer.id,
      round_started_at: startedAt,
      status: "playing",
    })
    .eq("id", roomId);

  await insertSystemMessage(
    roomId,
    drawer.id,
    drawer.name,
    `Rodada ${nextRound}: ${drawer.name} está desenhando!`
  );
}

async function finishRoundEarly(
  roomId: string,
  reason: "time" | "all_guessed" | "drawer_left"
) {
  const supabase = getSupabaseAdmin();
  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room || room.status !== "playing") return;

  const drawerId = room.drawer_id;
  await supabase.from("room_secrets").delete().eq("room_id", roomId);

  await supabase
    .from("rooms")
    .update({
      round_started_at: null,
    })
    .eq("id", roomId);

  const reasonText =
    reason === "time"
      ? "Tempo esgotado!"
      : reason === "all_guessed"
        ? "Todos acertaram!"
        : "O desenhista saiu. Rodada encerrada.";

  await insertSystemMessage(roomId, room.host_id ?? roomId, "Sistema", reasonText);

  if (room.current_round >= room.total_rounds) {
    await supabase.from("rooms").update({ status: "finished", drawer_id: null }).eq("id", roomId);
    await insertSystemMessage(roomId, room.host_id ?? roomId, "Sistema", "Partida finalizada!");
    return;
  }

  await startNextRound(roomId, drawerId);
}

export async function tickRoundIfExpired(code: string) {
  const room = await getRoomByCode(code);
  if (!room || room.status !== "playing" || !room.round_started_at) return;
  const left = remainingSeconds(room.round_started_at, room.round_duration);
  if (left <= 0) {
    await finishRoundEarly(room.id, "time");
  }
}

export async function getDrawerWord(code: string, playerId: string) {
  const room = await getRoomByCode(code);
  if (!room || room.status !== "playing") return null;
  if (room.drawer_id !== playerId) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("room_secrets")
    .select("word")
    .eq("room_id", room.id)
    .maybeSingle();
  return data?.word ?? null;
}

export async function submitStroke(
  code: string,
  playerId: string,
  stroke: Stroke,
  round: number
) {
  const room = await getRoomByCode(code);
  if (!room || room.status !== "playing") throw new Error("Rodada não ativa");
  if (isRoundIntroActive(room.round_started_at)) {
    throw new Error("Aguarde o início da rodada");
  }
  if (room.drawer_id !== playerId) throw new Error("Apenas o desenhista pode desenhar");
  if (room.current_round !== round) throw new Error("Rodada inválida");
  void stroke;
}

export async function clearCanvas(code: string, playerId: string, round: number) {
  const room = await getRoomByCode(code);
  if (!room || room.drawer_id !== playerId) throw new Error("Apenas o desenhista pode limpar");
  if (room.current_round !== round) throw new Error("Rodada inválida");
}

export async function submitGuess(code: string, playerId: string, message: string) {
  const room = await getRoomByCode(code);
  if (!room || room.status !== "playing") {
    throw new Error("Não há palpite neste momento");
  }
  if (isRoundIntroActive(room.round_started_at)) {
    throw new Error("Aguarde o início da rodada");
  }

  const supabase = getSupabaseAdmin();
  const { data: secret } = await supabase
    .from("room_secrets")
    .select("word")
    .eq("room_id", room.id)
    .maybeSingle();
  if (!secret?.word) throw new Error("Não há palpite neste momento");
  if (room.drawer_id === playerId) {
    throw new Error("O desenhista não pode enviar palpites");
  }

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .eq("room_id", room.id)
    .single();

  if (!player?.connected) throw new Error("Jogador não encontrado");
  if (player.guessed_this_round) throw new Error("Você já acertou nesta rodada");

  const trimmed = message.trim();
  if (!trimmed) throw new Error("Mensagem vazia");

  const isCorrect = guessesMatch(trimmed, secret.word);

  const { data: chatRow, error: chatError } = await supabase
    .from("chat_messages")
    .insert({
      room_id: room.id,
      player_id: playerId,
      player_name: player.name,
      message: trimmed,
      is_correct: isCorrect,
    })
    .select("*")
    .single();

  if (chatError || !chatRow) throw new Error(chatError?.message ?? "Erro ao enviar palpite");

  if (isCorrect) {
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("is_correct", true)
      .gte("created_at", room.round_started_at ?? new Date(0).toISOString());

    const orderIndex = Math.max(0, (count ?? 1) - 1);
    const guessPoints = pointsForGuessOrder(orderIndex);

    await supabase
      .from("players")
      .update({
        score: player.score + guessPoints,
        guessed_this_round: true,
      })
      .eq("id", playerId);

    if (room.drawer_id) {
      const { data: drawer } = await supabase
        .from("players")
        .select("score")
        .eq("id", room.drawer_id)
        .single();
      if (drawer) {
        await supabase
          .from("players")
          .update({ score: drawer.score + DRAWER_POINTS_PER_CORRECT_GUESS })
          .eq("id", room.drawer_id);
      }
    }

    await insertSystemMessage(
      room.id,
      playerId,
      player.name,
      `${player.name} acertou a palavra (+${guessPoints} pts)`
    );

    const players = await listPlayers(room.id);
    if (allGuessersFound(players, room.drawer_id)) {
      await finishRoundEarly(room.id, "all_guessed");
    }
  }

  return chatRow;
}

async function insertSystemMessage(
  roomId: string,
  playerId: string,
  playerName: string,
  message: string
) {
  const supabase = getSupabaseAdmin();
  await supabase.from("chat_messages").insert({
    room_id: roomId,
    player_id: playerId,
    player_name: playerName,
    message,
    is_system: true,
  });
}

export async function heartbeat(code: string, playerId: string) {
  const supabase = getSupabaseAdmin();
  const room = await getRoomByCode(code);
  if (!room) return;
  await supabase
    .from("players")
    .update({ connected: true })
    .eq("id", playerId)
    .eq("room_id", room.id);
  await tickRoundIfExpired(code);
}
