"use client";

import { useRef } from "react";
import { DrawingCanvas } from "@/components/Canvas/DrawingCanvas";
import { GameHeader } from "@/components/Room/GameHeader";
import { PlayerList } from "@/components/Room/PlayerList";
import { Chat } from "@/components/Room/Chat";
import { useDrawing } from "@/hooks/useDrawing";
import { getPlayer } from "@/hooks/usePlayers";
import type { RoomPublic } from "@/types/room";
import type { Player } from "@/types/player";

type Props = {
  room: RoomPublic;
  players: Player[];
  playerId: string;
  roomCode: string;
  secretWord: string | null;
  secondsLeft: number;
};

export function GameBoard({
  room,
  players,
  playerId,
  roomCode,
  secretWord,
  secondsLeft,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawer = room.drawer_id === playerId;
  const me = getPlayer(players, playerId);

  const { sendStroke, clearCanvasRemote } = useDrawing({
    roomId: room.id,
    round: room.current_round,
    canvasRef,
    enabled: isDrawer,
  });

  let statusLabel = "Adivinhe a palavra!";
  if (isDrawer && secretWord) {
    statusLabel = `Desenhe: ${secretWord}`;
  } else if (isDrawer) {
    statusLabel = "Carregando palavra...";
  }

  return (
    <div className="flex flex-col gap-4">
      <GameHeader
        statusLabel={statusLabel}
        secondsLeft={secondsLeft}
        round={room.current_round}
        totalRounds={room.total_rounds}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-center">
        <div className="flex min-w-0 flex-1 justify-center">
          <DrawingCanvas
            ref={canvasRef}
            canDraw={isDrawer}
            roomCode={roomCode}
            playerId={playerId}
            round={room.current_round}
            sendStroke={sendStroke}
            clearCanvasRemote={clearCanvasRemote}
          />
        </div>
        <aside className="box-border flex w-full max-w-full min-w-0 shrink-0 flex-col gap-4 overflow-hidden sm:max-w-[420px] lg:w-[380px] lg:max-w-[380px]">
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Jogadores</h3>
            <PlayerList
              players={players}
              hostId={room.host_id}
              drawerId={room.drawer_id}
              currentPlayerId={playerId}
            />
          </div>
          <Chat
            roomId={room.id}
            playerId={playerId}
            roomCode={roomCode}
            canGuess={!isDrawer && room.status === "playing"}
            guessedThisRound={me?.guessed_this_round ?? false}
            isDrawer={isDrawer}
          />
        </aside>
      </div>
    </div>
  );
}
