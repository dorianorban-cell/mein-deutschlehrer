import ProfileSelector from "@/components/ProfileSelector";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-gray-500 tracking-widest uppercase">
            Mein Deutschlehrer
          </p>
          <h1 className="text-5xl font-bold text-white">Wer bist du?</h1>
        </div>
        <ProfileSelector />
      </div>
    </main>
  );
}
