"use client";

import { useRef } from "react";
import { DrawingCanvas } from "@/components/Canvas/DrawingCanvas";
import { GameHeader } from "@/components/Room/GameHeader";
import { Chat } from "@/components/Room/Chat";
import { RoundStartOverlay } from "@/components/Game/RoundStartOverlay";
import { useDrawing } from "@/hooks/useDrawing";
import { useRoundIntro } from "@/hooks/useRoundIntro";
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
  const { introActive, introText } = useRoundIntro(
    room.round_started_at,
    room.current_round,
    room.status,
    isDrawer
  );

  const { sendStroke, clearCanvasRemote } = useDrawing({
    roomId: room.id,
    round: room.current_round,
    canvasRef,
    enabled: isDrawer && !introActive,
  });

  let statusLabel = "Adivinhe a palavra!";
  if (introActive && introText) {
    statusLabel = introText;
  } else if (isDrawer && secretWord) {
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
        <div className="relative flex min-w-0 flex-1 justify-center">
          <DrawingCanvas
            ref={canvasRef}
            canDraw={isDrawer && !introActive}
            roomCode={roomCode}
            playerId={playerId}
            round={room.current_round}
            sendStroke={sendStroke}
            clearCanvasRemote={clearCanvasRemote}
          />
          {introText && <RoundStartOverlay text={introText} />}
        </div>
        <aside className="box-border flex w-full max-w-full min-w-0 shrink-0 flex-col gap-4 overflow-hidden sm:max-w-[420px] lg:w-[380px] lg:max-w-[380px]">
          <Chat
            roomId={room.id}
            playerId={playerId}
            roomCode={roomCode}
            canGuess={!isDrawer && room.status === "playing" && !introActive}
            guessedThisRound={me?.guessed_this_round ?? false}
            isDrawer={isDrawer}
          />
        </aside>
      </div>
    </div>
  );
}
