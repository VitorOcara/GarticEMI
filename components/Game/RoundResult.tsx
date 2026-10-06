type Props = {
  message: string;
};

export function RoundResult({ message }: Props) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-center font-medium text-violet-900">
      {message}
    </div>
  );
}
