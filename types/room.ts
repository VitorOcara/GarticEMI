export type RoomStatus = "waiting" | "playing" | "finished";

export type RoomPublic = {
  id: string;
  code: string;
  host_id: string | null;
  status: RoomStatus;
  current_round: number;
  total_rounds: number;
  drawer_id: string | null;
  round_started_at: string | null;
  round_duration: number;
  created_at: string;
};

export type GameEvent =
  | { type: "player_joined"; playerId: string; name: string }
  | { type: "player_left"; playerId: string }
  | { type: "draw"; strokeId: string; stroke: import("./drawing").Stroke; round: number }
  | { type: "clear_canvas"; round: number }
  | { type: "guess"; messageId: string; playerId: string; playerName: string; message: string; isCorrect: boolean }
  | { type: "round_started"; round: number; drawerId: string }
  | { type: "round_finished"; round: number; reason: "time" | "all_guessed" | "drawer_left" }
  | { type: "game_finished" };
