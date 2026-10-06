import { RoomPageClient } from "@/components/Room/RoomPageClient";

type PageProps = {
  params: Promise<{ codigo: string }>;
};

export default async function SalaPage({ params }: PageProps) {
  const { codigo } = await params;
  return (
    <main className="min-h-full flex-1 bg-gradient-to-b from-slate-50 to-indigo-50 px-4 py-8">
      <RoomPageClient code={codigo} />
    </main>
  );
}
