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

function borderColor(count: number) {
  if (count >= 3) return "border-red-700";
  if (count === 2) return "border-yellow-600";
  return "border-gray-700";
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

// ── By Category ──────────────────────────────────────────────
function CategoryView({ mistakes }: { mistakes: Mistake[] }) {
  if (mistakes.length === 0) {
    return <EmptyState />;
  }

  // Group by category
  const groups: Record<string, Mistake[]> = {};
  for (const m of mistakes) {
    const cat = m.category || "other";
    (groups[cat] ??= []).push(m);
  }

  // Sort groups by sum of counts desc
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
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              {categoryLabel(cat)}
            </h3>
            <span className="text-xs text-gray-500">
              {items.reduce((s, m) => s + m.count, 0)} Vorkommen
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

// ── By Date ──────────────────────────────────────────────────
function DateView({ mistakes }: { mistakes: Mistake[] }) {
  if (mistakes.length === 0) {
    return <EmptyState />;
  }

  // Group by lastSeen day, reverse-chrono
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
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
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

// ── Shared mistake card ───────────────────────────────────────
function MistakeCard({ mistake: m, showBadge }: { mistake: Mistake; showBadge: boolean }) {
  return (
    <div
      className={`bg-gray-900 rounded-xl p-4 border-l-4 ${borderColor(m.count)} space-y-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 font-mono text-sm min-w-0">
          <p className="text-red-400 line-through leading-snug truncate">
            {m.original}
          </p>
          <p className="text-green-400 leading-snug truncate">{m.corrected}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {showBadge && (
            <span className="text-xs">
              {m.count > 1 ? "⚠️" : "🆕"}
            </span>
          )}
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              m.count >= 3
                ? "bg-red-900 text-red-300"
                : m.count === 2
                ? "bg-yellow-900 text-yellow-300"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {m.count}×
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-snug">💡 {m.rule}</p>
      <p className="text-xs text-gray-600">
        📅 Zuerst: {formatDate(m.firstSeen)} · Zuletzt: {formatDate(m.lastSeen)}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <p className="text-3xl">✅</p>
      <p className="text-gray-500 text-sm">Noch keine Fehler aufgezeichnet.</p>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
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
          `❌ ${m.original} → ✅ ${m.corrected}`,
          `💡 ${m.rule}`,
          `📅 Zuerst: ${formatDate(m.firstSeen)} · Zuletzt: ${formatDate(m.lastSeen)} · ${m.count}×`,
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Tab bar + copy button */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1">
          {(["category", "date"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-950"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "category" ? "Nach Kategorie" : "Nach Datum"}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          <span>{copied ? "✅" : "📋"}</span>
          <span>{copied ? "Kopiert!" : "Kopieren"}</span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "category" ? (
        <CategoryView mistakes={mistakes} />
      ) : (
        <DateView mistakes={mistakes} />
      )}
    </div>
  );
}
