import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ReportView from "@/components/ReportView";

interface Props {
  params: Promise<{ profileId: string }>;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-900 text-emerald-300",
  A2: "bg-teal-900 text-teal-300",
  B1: "bg-blue-900 text-blue-300",
  B2: "bg-violet-900 text-violet-300",
  C1: "bg-rose-900 text-rose-300",
};

export default async function ReportPage({ params }: Props) {
  const { profileId } = await params;

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) notFound();

  const [mistakes, sessions] = await Promise.all([
    prisma.mistake.findMany({
      where: { profileId },
      orderBy: { count: "desc" },
    }),
    prisma.session.findMany({
      where: { profileId },
      orderBy: { startedAt: "desc" },
      select: { id: true, startedAt: true, endedAt: true },
    }),
  ]);

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

  // Serialise DateTime fields to strings for client component
  const serialisedMistakes = mistakes.map((m) => ({
    ...m,
    firstSeen: m.firstSeen.toISOString(),
    lastSeen: m.lastSeen.toISOString(),
  }));

  const serialisedSessions = sessions.map((s) => ({
    ...s,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt?.toISOString() ?? null,
  }));

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-1">
          {/* Nav row */}
          <div className="flex items-center justify-between">
            <Link
              href={`/${profileId}`}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              ← Gespräch
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{profile.name}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  LEVEL_COLORS[profile.level] ?? "bg-gray-800 text-gray-400"
                }`}
              >
                {profile.level}
              </span>
            </div>
          </div>

          {/* Meta rows */}
          <p className="text-xs text-gray-500">Generiert: {generatedDate}</p>
          <p className="text-xs text-gray-500">
            Tracking seit: {trackingSince} · {totalOccurrences} Fehler aufgezeichnet
          </p>
        </div>
      </header>

      {/* Report content */}
      <ReportView
        mistakes={serialisedMistakes}
        sessions={serialisedSessions}
        totalOccurrences={totalOccurrences}
        profileName={profile.name}
        generatedDate={generatedDate}
        trackingSince={trackingSince}
      />
    </div>
  );
}
