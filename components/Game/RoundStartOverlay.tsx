"use client";

type Props = {
  text: string;
};

export function RoundStartOverlay({ text }: Props) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-900/75 backdrop-blur-sm"
      aria-live="polite"
    >
      <p className="animate-pulse px-4 text-center text-3xl font-black tracking-tight text-white sm:text-4xl">
        {text}
      </p>
    </div>
  );
}
