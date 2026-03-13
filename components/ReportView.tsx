"use client";

import { useState } from "react";

interface Mistake {
  id: string;
  original: string;
  corrected: string;
  rule: string;
  category: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

interface Props {
  mistakes: Mistake[];
  totalOccurrences: number;
  profileName: string;
  generatedDate: string;
  trackingSince: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  word_order: "Wortstellung",
  case: "Kasus",
  gender: "Genus",
  tense: "Zeitform",
  vocab: "Vokabular",
};

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDayHeading(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function IconLightbulb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CategoryView({ mistakes }: { mistakes: Mistake[] }) {
  if (mistakes.length === 0) return <EmptyState />;

  const groups: Record<string, Mistake[]> = {};
  for (const m of mistakes) {
    const cat = m.category || "other";
    (groups[cat] ??= []).push(m);
  }

  const sortedGroups = Object.entries(groups).sort(
    (a, b) =>
      b[1].reduce((s, m) => s + m.count, 0) -
      a[1].reduce((s, m) => s + m.count, 0)
  );

  return (
    <div className="space-y-8">
      {sortedGroups.map(([cat, items]) => (
        <section key={cat}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-jetbrains text-xs font-semibold text-forest uppercase tracking-widest">
              {categoryLabel(cat).toUpperCase()}
            </h3>
            <span className="font-jetbrains text-xs text-muted-brown">
              · {items.reduce((s, m) => s + m.count, 0)} Vorkommen
            </span>
          </div>
          <div className="space-y-2">
            {items.map((m) => (
              <MistakeCard key={m.id} mistake={m} showBadge={false} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DateView({ mistakes }: { mistakes: Mistake[] }) {
  if (mistakes.length === 0) return <EmptyState />;

  const groups: Record<string, Mistake[]> = {};
  for (const m of mistakes) {
    const key = dayKey(m.lastSeen);
    (groups[key] ??= []).push(m);
  }

  const sortedDays = Object.entries(groups).sort((a, b) => {
    const da = new Date(a[1][0].lastSeen).getTime();
    const db = new Date(b[1][0].lastSeen).getTime();
    return db - da;
  });

  return (
    <div className="space-y-8">
      {sortedDays.map(([, items]) => (
        <section key={dayKey(items[0].lastSeen)}>
          <h3 className="font-jetbrains text-xs font-semibold text-muted-brown uppercase tracking-widest mb-3">
            {formatDayHeading(items[0].lastSeen)}
          </h3>
          <div className="space-y-2">
            {items.map((m) => (
              <MistakeCard key={m.id} mistake={m} showBadge />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MistakeCard({ mistake: m, showBadge }: { mistake: Mistake; showBadge: boolean }) {
  const badgeLabel = m.count > 1 ? "wiederholt" : "neu";
  const badgeStyle = m.count > 1
    ? "bg-amber-100 text-amber-700 border border-amber-200"
    : "bg-green-50 text-forest border border-green-200";

  return (
    <div className="bg-cream border border-border-warm rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="font-jetbrains text-sm text-correction-red line-through leading-snug truncate">
            {m.original}
          </p>
          <p className="font-jetbrains text-sm text-forest font-semibold leading-snug truncate">
            {m.corrected}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {showBadge && (
            <span className={`font-jetbrains text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeStyle}`}>
              {badgeLabel}
            </span>
          )}
          <span
            className={`font-jetbrains text-xs font-bold px-2 py-0.5 rounded-full ${
              m.count >= 3
                ? "bg-red-100 text-correction-red"
                : m.count === 2
                ? "bg-amber-100 text-amber-700"
                : "bg-border-warm text-muted-brown"
            }`}
          >
            {m.count}&times;
          </span>
        </div>
      </div>
      <p className="font-source-serif text-xs text-muted-brown leading-snug flex items-start gap-1">
        <IconLightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        {m.rule}
      </p>
      <p className="font-jetbrains text-[10px] text-muted-brown/70 flex items-center gap-1">
        <IconCalendar className="w-3 h-3 shrink-0" />
        Zuerst: {formatDate(m.firstSeen)} · Zuletzt: {formatDate(m.lastSeen)}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <IconCheck className="w-12 h-12 text-forest opacity-30" />
      <p className="font-source-serif italic text-muted-brown text-sm">
        Noch keine Fehler aufgezeichnet.
      </p>
    </div>
  );
}

export default function ReportView({
  mistakes,
  totalOccurrences,
  profileName,
  generatedDate,
  trackingSince,
}: Props) {
  const [activeTab, setActiveTab] = useState<"category" | "date">("category");
  const [copied, setCopied] = useState(false);

  function buildMarkdown() {
    const lines: string[] = [
      `# Fehlerreport — ${profileName}`,
      `Generiert: ${generatedDate}`,
      `Tracking seit: ${trackingSince} · ${totalOccurrences} Fehler aufgezeichnet`,
      "",
      "## Nach Kategorie",
    ];

    const groups: Record<string, Mistake[]> = {};
    for (const m of mistakes) {
      (groups[m.category ?? "other"] ??= []).push(m);
    }
    for (const [cat, items] of Object.entries(groups)) {
      lines.push(`\n### ${categoryLabel(cat)}`);
      for (const m of items) {
        lines.push(
          `Fehler: ${m.original} → Korrekt: ${m.corrected}`,
          `Regel: ${m.rule}`,
          `Zuerst: ${formatDate(m.firstSeen)} · Zuletzt: ${formatDate(m.lastSeen)} · ${m.count}x`,
          ""
        );
      }
    }
    return lines.join("\n");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-none">
      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Tab pills + copy */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex gap-1 bg-border-warm/40 rounded-full p-1">
            {(["category", "date"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-jetbrains px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${
                  activeTab === tab
                    ? "bg-forest text-cream"
                    : "text-muted-brown hover:text-forest"
                }`}
              >
                {tab === "category" ? "Nach Kategorie" : "Nach Datum"}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 font-jetbrains text-xs px-3 py-2 rounded-lg border border-border-warm text-muted-brown hover:text-forest hover:border-forest transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copied ? "Kopiert!" : "Kopieren"}</span>
          </button>
        </div>

        {activeTab === "category" ? (
          <CategoryView mistakes={mistakes} />
        ) : (
          <DateView mistakes={mistakes} />
        )}
      </div>
    </div>
  );
}
