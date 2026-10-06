type Props = {
  statusLabel: string;
  secondsLeft: number;
  round: number;
  totalRounds: number;
};

export function GameHeader({ statusLabel, secondsLeft, round, totalRounds }: Props) {
  const urgent = secondsLeft <= 10;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
        <p className="text-lg font-bold text-slate-900">{statusLabel}</p>
        {totalRounds > 0 && (
          <p className="text-sm text-slate-600">
            Rodada {round} de {totalRounds}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-wide text-slate-500">Tempo</p>
        <p
          className={`font-mono text-3xl font-bold tabular-nums ${
            urgent ? "text-red-600 animate-pulse" : "text-indigo-600"
          }`}
        >
          {secondsLeft}s
        </p>
      </div>
    </div>
  );
}
