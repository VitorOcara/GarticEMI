"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isCorrectAnnouncement, shouldShowChatMessage } from "@/lib/chatVisibility";
import type { ChatMessage } from "@/types/chat";

export type { ChatMessage };

type Props = {
  roomId: string;
  playerId: string;
  roomCode: string;
  canGuess: boolean;
  guessedThisRound: boolean;
  isDrawer: boolean;
};

export function Chat({
  roomId,
  playerId,
  roomCode,
  canGuess,
  guessedThisRound,
  isDrawer,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages((data ?? []) as ChatMessage[]);
    };
    void load();

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  const visibleMessages = useMemo(
    () => messages.filter((m) => shouldShowChatMessage(m, playerId, isDrawer)),
    [messages, playerId, isDrawer]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !canGuess || guessedThisRound) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, message: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar");
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="box-border flex h-[min(42vh,320px)] w-full max-w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="box-border shrink-0 border-b border-slate-100 px-3 py-2.5">
        <p className="text-sm font-semibold text-slate-700">Chat / Palpites</p>
        {isDrawer && (
          <p className="text-xs text-violet-600">Você vê todos os palpites dos jogadores</p>
        )}
        {!isDrawer && (
          <p className="text-xs text-slate-500">Só você vê seus palpites; acertos aparecem para todos</p>
        )}
      </div>
      <div className="box-border min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3 text-sm">
        {visibleMessages.map((m) => (
          <div
            key={m.id}
            className={
              isCorrectAnnouncement(m)
                ? "rounded-lg bg-green-50 px-2 py-1.5 text-center text-sm font-semibold text-green-800"
                : m.is_system
                  ? "text-center text-xs text-slate-500"
                  : m.is_correct
                    ? "rounded-lg bg-green-50 px-2 py-1 font-medium text-green-800"
                    : "break-words"
            }
          >
            {m.is_system || isCorrectAnnouncement(m) ? (
              m.message
            ) : (
              <>
                <span className="font-semibold text-slate-800">{m.player_name}:</span>{" "}
                {m.is_correct ? "★ " : ""}
                {m.message}
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => void send(e)}
        className="box-border w-full max-w-full shrink-0 overflow-hidden rounded-b-2xl border-t border-slate-100 bg-slate-50/80 p-3"
      >
        {error && <p className="mb-2 break-words text-xs text-red-600">{error}</p>}
        <div className="box-border flex w-full max-w-full min-w-0 items-stretch gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!canGuess || guessedThisRound || sending}
            placeholder={
              !canGuess
                ? "Você está desenhando..."
                : guessedThisRound
                  ? "Você já acertou!"
                  : "Seu palpite..."
            }
            className="box-border min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            disabled={!canGuess || guessedThisRound || sending}
            className="box-border shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}
