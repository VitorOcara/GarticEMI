import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const channels = new Map<string, RealtimeChannel>();

export function getRoomChannel(roomId: string): RealtimeChannel {
  const existing = channels.get(roomId);
  if (existing) return existing;
  const supabase = getSupabaseBrowserClient();
  const channel = supabase.channel(`room:${roomId}`, {
    config: { presence: { key: roomId } },
  });
  channels.set(roomId, channel);
  return channel;
}

export async function subscribeRoomChannel(
  roomId: string
): Promise<RealtimeChannel> {
  const channel = getRoomChannel(roomId);
  if (channel.state === "joined") return channel;
  return new Promise((resolve, reject) => {
    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") resolve(channel);
      if (status === "CHANNEL_ERROR") reject(err ?? new Error("Erro no canal"));
    });
  });
}

export function leaveRoomChannel(roomId: string): void {
  const channel = channels.get(roomId);
  if (channel) {
    void getSupabaseBrowserClient().removeChannel(channel);
    channels.delete(roomId);
  }
}
