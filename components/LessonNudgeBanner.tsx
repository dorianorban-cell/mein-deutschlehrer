"use client";

import Link from "next/link";
import type { Correction } from "@/components/ConversationFeed";
import type { LessonCategory } from "@/lib/lesson-types";

interface Props {
  profileId: string;
  corrections: Correction[];
  onDismiss: () => void;
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

export default function LessonNudgeBanner({ profileId, corrections, onDismiss }: Props) {
  // Find the most-repeated category from session corrections
  const counts: Record<string, number> = {};
  for (const c of corrections) {
    counts[c.category] = (counts[c.category] ?? 0) + 1;
  }
  const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as LessonCategory ?? "word_order";

  return (
    <div className="shrink-0 bg-gold/15 border-t border-gold/30 px-4 py-2.5 flex items-center gap-3">
      <IconBook className="w-4 h-4 text-forest shrink-0" />
      <p className="font-source-serif text-sm text-forest flex-1">
        Du hast{" "}
        <span className="font-semibold">{corrections.length} {corrections.length === 1 ? "Fehler" : "Fehler"}</span>{" "}
        gemacht — Lektion starten?
      </p>
      <Link
        href={`/${profileId}/lektion?category=${topCategory}`}
        className="shrink-0 font-jetbrains text-[10px] font-semibold text-cream bg-forest px-3 py-1.5 rounded-full hover:brightness-110 transition-all"
      >
        Lernen
      </Link>
      <button
        onClick={onDismiss}
        className="shrink-0 w-6 h-6 flex items-center justify-center text-muted-brown hover:text-forest transition-colors"
      >
        <IconX className="w-4 h-4" />
      </button>
    </div>
  );
}
