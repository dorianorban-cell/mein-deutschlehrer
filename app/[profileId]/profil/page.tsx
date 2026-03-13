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

function IconFlame({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
    </svg>
  );
}

function IconDiamond({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5L2 9l10 12L22 9l-3-6zm-7 14.5L4.5 9H8l4 9zm0 0l4-9h3.5L12 17.5zM9.5 9l2.5-4 2.5 4h-5z" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

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
      <div className="flex-1 overflow-y-auto scrollbar-none px-6 pt-12 pb-6">

        {/* Greeting */}
        <h1 className="font-playfair font-bold text-4xl text-forest mb-2">
          Hallo, {profile.name}!
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
            <IconFlame className="w-7 h-7 text-gold" />
            <span className="font-jetbrains text-xl font-bold text-forest">{streak}</span>
            <span className="font-jetbrains text-[10px] text-muted-brown uppercase tracking-wide">Streak</span>
          </div>
          <div className="bg-cream border border-border-warm rounded-xl p-4 flex flex-col items-center gap-1.5">
            <IconDiamond className="w-7 h-7 text-forest" />
            <span className="font-jetbrains text-xl font-bold text-forest">{totalMistakes}</span>
            <span className="font-jetbrains text-[10px] text-muted-brown uppercase tracking-wide">Fehler</span>
          </div>
          <div className="bg-cream border border-border-warm rounded-xl p-4 flex flex-col items-center gap-1.5">
            <IconCalendar className="w-7 h-7 text-forest" />
            <span className="font-jetbrains text-[11px] font-bold text-forest text-center leading-tight">{memberSince}</span>
            <span className="font-jetbrains text-[10px] text-muted-brown uppercase tracking-wide">Seit</span>
          </div>
        </div>

        <hr className="border-border-warm mb-8" />

        <Link
          href={`/${profileId}/report`}
          className="block w-full border-2 border-forest text-forest font-jetbrains font-semibold text-sm tracking-wide py-3.5 rounded-xl text-center mb-4 hover:bg-forest hover:text-cream transition-colors"
        >
          Fehler-Bericht öffnen
        </Link>

        <div className="h-16" />

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
