"use client";

import { useEffect, useState } from "react";
import { ContinueLastRoom } from "@/components/ui/ContinueLastRoom";
import { PlayMenuForm } from "@/components/ui/PlayMenuForm";

export function PlayMenuPageClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="mx-auto w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg"
        aria-hidden
      >
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <>
      <ContinueLastRoom />
      <PlayMenuForm />
    </>
  );
}
