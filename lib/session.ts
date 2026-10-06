const PLAYER_ID_KEY = "gartic_player_id";
const PLAYER_NAME_KEY = "gartic_player_name";
const LAST_ROOM_CODE_KEY = "gartic_last_room_code";
const ROOM_PLAYER_PREFIX = "gartic_room_player_";

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getPlayerName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_NAME_KEY);
}

export function setPlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_KEY, name.trim());
}

export function getLastRoomCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_ROOM_CODE_KEY);
}

export function setLastRoomCode(roomCode: string): void {
  localStorage.setItem(LAST_ROOM_CODE_KEY, roomCode.trim().toUpperCase());
}

export function setRoomPlayerId(roomCode: string, playerId: string): void {
  localStorage.setItem(`${ROOM_PLAYER_PREFIX}${roomCode.toUpperCase()}`, playerId);
}

export function getRoomPlayerId(roomCode: string): string | null {
  return localStorage.getItem(`${ROOM_PLAYER_PREFIX}${roomCode.toUpperCase()}`);
}

/** Salva apelido + vínculo com a sala (sessão local, sem login). */
export function rememberRoomSession(
  roomCode: string,
  playerId: string,
  playerName: string
): void {
  setPlayerName(playerName);
  setLastRoomCode(roomCode);
  setRoomPlayerId(roomCode, playerId);
}

export function clearRoomSession(roomCode: string): void {
  localStorage.removeItem(`${ROOM_PLAYER_PREFIX}${roomCode.toUpperCase()}`);
  const last = getLastRoomCode();
  if (last === roomCode.toUpperCase()) {
    localStorage.removeItem(LAST_ROOM_CODE_KEY);
  }
}

/** Id usado nesta sala: salvo na sala ou id global do navegador. */
export function resolvePlayerIdForRoom(roomCode: string): string {
  return getRoomPlayerId(roomCode) ?? getOrCreatePlayerId();
}
