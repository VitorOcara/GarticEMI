"use client";

import { useEffect, useState } from "react";
import {
  ROUND_INTRO_TOTAL_MS,
  getRoundIntroText,
  isRoundIntroActive,
} from "@/lib/game";

export function useRoundIntro(
  roundStartedAt: string | null,
  currentRound: number,
  status: string,
  isDrawer: boolean
) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "playing" || !roundStartedAt) return;
    const started = new Date(roundStartedAt).getTime();
    if (Date.now() - started >= ROUND_INTRO_TOTAL_MS) return;

    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [roundStartedAt, currentRound, status]);

  if (status !== "playing" || !roundStartedAt) {
    return { introActive: false, introText: null as string | null };
  }

  const introActive = isRoundIntroActive(roundStartedAt, nowMs);
  const introText = getRoundIntroText(roundStartedAt, isDrawer, nowMs);

  return { introActive, introText };
}
