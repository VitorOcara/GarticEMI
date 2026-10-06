export type Player = {
  id: string;
  room_id: string;
  name: string;
  score: number;
  is_host: boolean;
  connected: boolean;
  guessed_this_round: boolean;
  joined_at: string;
};
