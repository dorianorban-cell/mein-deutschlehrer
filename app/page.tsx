import ProfileSelector from "@/components/ProfileSelector";

export default function Home() {
  return (
    <main className="min-h-screen bg-app-bg flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Title */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Wer bist du?
          </h1>
          <p className="text-xs font-semibold text-neon tracking-[0.22em] uppercase">
            Wähle dein Profil
          </p>
        </div>

        <ProfileSelector />

        {/* Footer */}
        <p className="text-[11px] text-green-900 tracking-widest uppercase flex items-center gap-1.5">
          <span>🌐</span>
          <span>Deutsch lernen mit Zukunft</span>
        </p>
      </div>
    </main>
  );
}
