"use client";

import type { Correction } from "@/components/ConversationFeed";

const CATEGORY_STYLES: Record<string, string> = {
  word_order: "bg-blue-50 text-blue-700 border-blue-200",
  case: "bg-purple-50 text-purple-700 border-purple-200",
  gender: "bg-pink-50 text-pink-700 border-pink-200",
  tense: "bg-amber-50 text-amber-700 border-amber-200",
  vocab: "bg-border-warm/40 text-muted-brown border-border-warm",
};

const CATEGORY_LABELS: Record<string, string> = {
  word_order: "Wortstellung",
  case: "Kasus",
  gender: "Genus",
  tense: "Zeitform",
  vocab: "Vokabular",
};

function categoryStyle(cat: string) {
  return CATEGORY_STYLES[cat] ?? "bg-border-warm/40 text-muted-brown border-border-warm";
}

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat;
}

interface Props {
  corrections: Correction[];
  isOpen: boolean;
  onClose: () => void;
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconLightbulb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

export default function MistakePanel({ corrections, isOpen, onClose }: Props) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 right-0 h-full w-72 bg-cream border-l border-border-warm
          flex flex-col z-30
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-warm shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-playfair font-bold text-forest text-sm">Fehler heute</span>
            {corrections.length > 0 && (
              <span className="font-jetbrains text-xs bg-correction-red text-white font-bold px-1.5 py-0.5 rounded-full">
                {corrections.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-brown hover:text-forest transition-colors p-1"
            aria-label="Panel schließen"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
          {corrections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <IconCheck className="w-10 h-10 text-forest opacity-40" />
              <p className="font-source-serif italic text-sm text-muted-brown">
                Noch keine Fehler —{"\n"}gut gemacht!
              </p>
            </div>
          ) : (
            corrections.map((c, i) => (
              <div
                key={i}
                className="bg-parchment border border-border-warm rounded-xl p-3 space-y-2"
              >
                <span
                  className={`font-jetbrains text-xs font-semibold px-2 py-0.5 rounded-full border ${categoryStyle(c.category)}`}
                >
                  {categoryLabel(c.category)}
                </span>
                <div className="space-y-1 font-jetbrains text-sm">
                  <p className="text-correction-red line-through leading-snug">{c.original}</p>
                  <p className="text-forest font-semibold leading-snug">{c.corrected}</p>
                </div>
                <p className="font-source-serif text-xs text-muted-brown leading-snug flex items-start gap-1">
                  <IconLightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {c.rule}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
