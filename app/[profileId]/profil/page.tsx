import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import BottomNav from "@/components/BottomNav";

interface Props {
  params: Promise<{ profileId: string }>;
}

const LEVEL_NAMES: Record<string, string> = {
  A1: "Anfänger",
  A2: "Grundstufe",
  B1: "Mittelstufe",
  B2: "Fortgeschritten",
  C1: "Kompetent",
};

export default async function ProfilPage({ params }: Props) {
  const { profileId } = await params;

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) notFound();

  const mistakes = await prisma.mistake.findMany({ where: { profileId } });
  const totalMistakes = mistakes.reduce((sum, m) => sum + m.count, 0);

  const sessions = await prisma.session.findMany({
    where: { profileId },
    select: { startedAt: true },
  });

  // Compute streak: consecutive days with sessions going back from today
  const daySet = new Set(sessions.map((s) => s.startedAt.toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (daySet.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const memberSince = profile.createdAt.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  const levelName = LEVEL_NAMES[profile.level] ?? profile.level;

  return (
    <div className="flex flex-col h-screen bg-parchment">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-6 pt-12 pb-6">

        {/* Greeting */}
        <h1 className="font-playfair font-bold text-4xl text-forest mb-2">
          Hallo, {profile.name}! 👋
        </h1>
        <p className="font-source-serif italic text-gold text-lg mb-6 leading-snug">
          {daysSince === 0
            ? "Schön, dass du da bist. Fang an!"
            : `Du lernst seit ${daysSince} ${daysSince === 1 ? "Tag" : "Tagen"}. Weiter so!`}
        </p>

        {/* Level badge */}
        <div className="mb-8">
          <span className="inline-block bg-forest text-gold font-jetbrains text-sm font-semibold px-5 py-1.5 rounded-full tracking-wide">
            {profile.level} · {levelName}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-cream border border-border-warm rounded-xl p-4 flex flex-col items-center gap-1.5">
            <span className="text-2xl">🔥</span>
            <span className="font-jetbrains text-xl font-bold text-forest">{streak}</span>
            <span className="font-jetbrains text-[10px] text-muted-brown uppercase tracking-wide">Streak</span>
          </div>
          <div className="bg-cream border border-border-warm rounded-xl p-4 flex flex-col items-center gap-1.5">
            <span className="text-2xl">✦</span>
            <span className="font-jetbrains text-xl font-bold text-forest">{totalMistakes}</span>
            <span className="font-jetbrains text-[10px] text-muted-brown uppercase tracking-wide">Fehler</span>
          </div>
          <div className="bg-cream border border-border-warm rounded-xl p-4 flex flex-col items-center gap-1.5">
            <span className="text-2xl">📅</span>
            <span className="font-jetbrains text-[11px] font-bold text-forest text-center leading-tight">{memberSince}</span>
            <span className="font-jetbrains text-[10px] text-muted-brown uppercase tracking-wide">Seit</span>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-border-warm mb-8" />

        {/* Report button */}
        <Link
          href={`/${profileId}/report`}
          className="block w-full border-2 border-forest text-forest font-jetbrains font-semibold text-sm tracking-wide py-3.5 rounded-xl text-center mb-4 hover:bg-forest hover:text-cream transition-colors"
        >
          Fehler-Bericht öffnen
        </Link>

        {/* Placeholder space for future buttons */}
        <div className="h-16" />

        {/* Profile switch */}
        <Link
          href="/"
          className="block w-full text-center font-jetbrains text-sm text-muted-brown hover:text-forest transition-colors py-2"
        >
          Profil wechseln
        </Link>
      </div>

      <BottomNav profileId={profileId} active="profil" />
    </div>
  );
}
