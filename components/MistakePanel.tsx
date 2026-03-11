"use client";

import type { Correction } from "@/components/ConversationFeed";

const CATEGORY_STYLES: Record<string, string> = {
  word_order: "bg-blue-900 text-blue-300",
  case: "bg-purple-900 text-purple-300",
  gender: "bg-pink-900 text-pink-300",
  tense: "bg-amber-900 text-amber-300",
  vocab: "bg-gray-700 text-gray-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  word_order: "Wortstellung",
  case: "Kasus",
  gender: "Genus",
  tense: "Zeitform",
  vocab: "Vokabular",
};

function categoryStyle(cat: string) {
  return CATEGORY_STYLES[cat] ?? "bg-gray-700 text-gray-300";
}

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat;
}

interface Props {
  corrections: Correction[];
  isOpen: boolean;
  onClose: () => void;
}

export default function MistakePanel({ corrections, isOpen, onClose }: Props) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-72 bg-gray-900 border-l border-gray-800
          flex flex-col z-30
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Fehler heute</span>
            {corrections.length > 0 && (
              <span className="text-xs bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                {corrections.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
            aria-label="Panel schließen"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {corrections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <p className="text-2xl">✅</p>
              <p className="text-sm text-gray-500">Noch keine Fehler —{"\n"}gut gemacht!</p>
            </div>
          ) : (
            corrections.map((c, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-xl p-3 space-y-2 border border-gray-700"
              >
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryStyle(c.category)}`}
                >
                  {categoryLabel(c.category)}
                </span>
                <div className="space-y-1 font-mono text-sm">
                  <p className="text-red-400 line-through leading-snug">{c.original}</p>
                  <p className="text-green-400 leading-snug">{c.corrected}</p>
                </div>
                <p className="text-xs text-gray-500 leading-snug">💡 {c.rule}</p>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
