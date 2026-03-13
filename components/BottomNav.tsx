"use client";

import Link from "next/link";

interface Props {
  profileId: string;
  active: "chat" | "report" | "profil";
}

export default function BottomNav({ profileId, active }: Props) {
  return (
    <nav className="shrink-0 bg-cream border-t border-border-warm">
      <div className="flex items-center justify-around px-4 py-2.5">
        <Link
          href={`/${profileId}/report`}
          className={`flex flex-col items-center gap-1 px-5 py-1 transition-colors ${
            active === "report" ? "text-forest" : "text-muted-brown"
          }`}
        >
          <span className="text-xl">📋</span>
          <span className="font-jetbrains text-[9px] font-semibold tracking-wider uppercase">
            REPORT
          </span>
        </Link>

        <Link
          href={`/${profileId}`}
          className={`flex flex-col items-center gap-1 px-5 py-1 transition-colors ${
            active === "chat" ? "text-forest" : "text-muted-brown"
          }`}
        >
          <span className="text-xl">🎙️</span>
          <span className="font-jetbrains text-[9px] font-semibold tracking-wider uppercase">
            CHAT
          </span>
        </Link>

        <Link
          href={`/${profileId}/profil`}
          className={`flex flex-col items-center gap-1 px-5 py-1 transition-colors ${
            active === "profil" ? "text-forest" : "text-muted-brown"
          }`}
        >
          <span className="text-xl">👤</span>
          <span className="font-jetbrains text-[9px] font-semibold tracking-wider uppercase">
            PROFIL
          </span>
        </Link>
      </div>
    </nav>
  );
}
