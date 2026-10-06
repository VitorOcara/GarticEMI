type Props = { secondsLeft: number };

export function RoundTimer({ secondsLeft }: Props) {
  const urgent = secondsLeft <= 10;
  return (
    <span
      className={`font-mono text-2xl font-bold tabular-nums ${
        urgent ? "text-red-600" : "text-indigo-600"
      }`}
    >
      {secondsLeft}s
    </span>
  );
}
