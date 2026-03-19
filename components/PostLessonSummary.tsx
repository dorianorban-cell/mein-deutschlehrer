"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { LessonContent } from "@/lib/lesson-types";

interface Props {
  lesson: LessonContent;
  score: number;
  total: number;
  profileId: string;
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function PostLessonSummary({ lesson, score, total, profileId }: Props) {
  useEffect(() => {
    fetch("/api/lektion/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, category: lesson.category, score, total }),
    }).catch(() => {});
  }, [profileId, lesson.category, score, total]);

  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const stars = pct >= 80 ? 3 : pct >= 50 ? 2 : 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      {/* Stars */}
      <div className="flex gap-1 mb-6">
        {[1, 2, 3].map((s) => (
          <IconStar
            key={s}
            className={`w-10 h-10 ${s <= stars ? "text-gold" : "text-border-warm"}`}
          />
        ))}
      </div>

      {/* Max avatar */}
      <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center mb-4">
        <span className="font-playfair font-bold text-3xl text-gold leading-none">M</span>
      </div>

      <h2 className="font-playfair text-2xl font-bold text-forest mb-2 text-center">
        Lektion abgeschlossen!
      </h2>
      <p className="font-source-serif text-muted-brown text-center mb-1">
        {lesson.categoryLabel}
      </p>
      <p className="font-jetbrains text-sm text-forest mb-8">
        {score} von {total} Übungen richtig
      </p>

      {/* Score bar */}
      <div className="w-full max-w-xs bg-border-warm rounded-full h-2 mb-10">
        <div
          className="bg-forest rounded-full h-2 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Recap */}
      <div className="w-full max-w-xs space-y-2 mb-10">
        {lesson.exercises.map((ex, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-cream border border-border-warm rounded-xl px-4 py-3"
          >
            <IconCheck className="w-4 h-4 text-forest shrink-0" />
            <span className="font-jetbrains text-[11px] text-muted-brown">
              {ex.instruction}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href={`/${profileId}`}
          className="w-full py-3 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl text-center hover:brightness-110 transition-all"
        >
          Weiter üben
        </Link>
        <Link
          href={`/${profileId}/report`}
          className="w-full py-3 bg-cream border-2 border-border-warm text-forest font-jetbrains text-xs font-semibold rounded-2xl text-center hover:border-forest transition-all"
        >
          Zum Bericht
        </Link>
      </div>
    </div>
  );
}
