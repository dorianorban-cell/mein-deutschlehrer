import ProfileSelector from "@/components/ProfileSelector";

export default function Home() {
  return (
    <main className="min-h-screen bg-parchment flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full bg-forest flex items-center justify-center mb-2">
            <span className="font-playfair font-bold text-2xl text-gold leading-none">M</span>
          </div>
          <h1 className="font-playfair font-bold text-3xl text-forest tracking-tight">
            Wer bist du?
          </h1>
          <p className="font-jetbrains text-[10px] text-muted-brown tracking-[0.22em] uppercase">
            Wähle dein Profil
          </p>
        </div>

        <ProfileSelector />

        {/* Footer */}
        <p className="font-jetbrains text-[10px] text-muted-brown tracking-widest uppercase flex items-center gap-1.5">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
          </svg>
          <span>Deutsch lernen mit Zukunft</span>
        </p>
      </div>
    </main>
  );
}
