"use client";

import { useEffect, useState } from "react";
import type { WeaknessEntry } from "@/app/api/schwaeche/route";

interface Props {
  profileId: string;
}

function IconTarget({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

const BAR_COLORS = ["bg-correction-red", "bg-gold", "bg-muted-brown"];
const TEXT_COLORS = ["text-correction-red", "text-gold", "text-muted-brown"];

export default function SchwaecheRadar({ profileId }: Props) {
  const [weaknesses, setWeaknesses] = useState<WeaknessEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/schwaeche?profileId=${profileId}`)
      .then((r) => r.json())
      .then((d) => {
        setWeaknesses(d.weaknesses ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [profileId]);

  if (!loaded || weaknesses.length === 0) return null;

  const maxCount = weaknesses[0]?.totalCount ?? 1;

  return (
    <div className="bg-cream border border-border-warm rounded-2xl px-4 py-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <IconTarget className="w-4 h-4 text-correction-red shrink-0" />
        <span className="font-jetbrains text-[10px] tracking-widest uppercase text-muted-brown">
          Schwäche-Radar
        </span>
      </div>

      <div className="space-y-3">
        {weaknesses.map((w, i) => (
          <div key={w.category}>
            <div className="flex items-center justify-between mb-1">
              <span className={`font-playfair text-sm font-semibold ${TEXT_COLORS[i]}`}>
                {w.categoryLabel}
              </span>
              <span className="font-jetbrains text-[10px] text-muted-brown">
                {w.totalCount}×
              </span>
            </div>
            <div className="h-1.5 bg-border-warm rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all duration-700 ${BAR_COLORS[i]}`}
                style={{ width: `${Math.round((w.totalCount / maxCount) * 100)}%` }}
              />
            </div>
            {w.topRule && (
              <p className="font-jetbrains text-[9px] text-muted-brown truncate">
                {w.topRule}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
