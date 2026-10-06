export type ChatMessage = {
  id: string;
  player_id: string;
  player_name: string;
  message: string;
  is_correct: boolean;
  is_system: boolean;
  created_at: string;
};
