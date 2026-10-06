import type { ChatMessage } from "@/types/chat";

/** Palpites de outros ficam ocultos; desenhista vê todos; acertos públicos só via mensagem de sistema. */
export function shouldShowChatMessage(
  message: ChatMessage,
  viewerPlayerId: string,
  isDrawer: boolean
): boolean {
  if (message.is_system) return true;
  if (isDrawer) return true;
  if (message.player_id !== viewerPlayerId) return false;
  if (message.is_correct) return false;
  return true;
}

export function isCorrectAnnouncement(message: ChatMessage): boolean {
  return message.is_system && message.message.includes("acertou a palavra");
}
