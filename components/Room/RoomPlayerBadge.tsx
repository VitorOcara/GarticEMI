type Props = {
  name: string;
};

export function RoomPlayerBadge({ name }: Props) {
  return (
    <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-900">
      <span className="text-indigo-500">Conectado como </span>
      <span className="font-semibold">{name}</span>
    </div>
  );
}
