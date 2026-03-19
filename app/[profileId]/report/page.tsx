import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ReportView from "@/components/ReportView";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

interface Props {
  params: Promise<{ profileId: string }>;
}


export default async function ReportPage({ params }: Props) {
  const { profileId } = await params;

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) notFound();

  const mistakes = await prisma.mistake.findMany({
    where: { profileId },
    orderBy: { count: "desc" },
  });

  const totalOccurrences = mistakes.reduce((sum, m) => sum + m.count, 0);

  const generatedDate = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const trackingSince = profile.createdAt.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const serialisedMistakes = mistakes.map((m) => ({
    ...m,
    firstSeen: m.firstSeen.toISOString(),
    lastSeen: m.lastSeen.toISOString(),
  }));

  return (
    <div className="flex flex-col h-screen bg-parchment">
      {/* Header */}
      <header className="shrink-0 bg-cream border-b border-border-warm px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Nav row */}
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/${profileId}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-brown hover:text-forest hover:bg-border-warm/40 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <h1 className="font-playfair font-bold text-forest text-xl absolute left-1/2 -translate-x-1/2">
              Fehler-Bericht
            </h1>

            <div className="flex items-center gap-2">
              <span className="font-source-serif text-sm text-forest font-semibold">{profile.name}</span>
              <span className="font-jetbrains text-xs font-bold bg-forest text-gold px-2 py-0.5 rounded-full">
                {profile.level}
              </span>
            </div>
          </div>

          {/* Meta */}
          <p className="font-jetbrains text-[10px] text-muted-brown text-center">
            Generiert: {generatedDate} · {totalOccurrences} Fehler aufgezeichnet
          </p>
        </div>
      </header>

      {/* Report content — scrollable */}
      <ReportView
        mistakes={serialisedMistakes}
        totalOccurrences={totalOccurrences}
        profileName={profile.name}
        generatedDate={generatedDate}
        trackingSince={trackingSince}
        profileId={profileId}
      />

      <BottomNav profileId={profileId} active="report" />
    </div>
  );
}
