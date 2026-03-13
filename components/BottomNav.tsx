"use client";

import Link from "next/link";

interface Props {
  profileId: string;
  active: "chat" | "report" | "profil";
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function IconMic({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1a4 4 0 014 4v7a4 4 0 01-8 0V5a4 4 0 014-4zm0 2a2 2 0 00-2 2v7a2 2 0 004 0V5a2 2 0 00-2-2zm-7 9a7 7 0 0014 0h2a9 9 0 01-8 8.94V22h2v2H9v-2h2v-1.06A9 9 0 013 12h2z" />
    </svg>
  );
}

function IconPerson({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
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
          <IconClipboard className="w-5 h-5" />
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
          <IconMic className="w-5 h-5" />
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
          <IconPerson className="w-5 h-5" />
          <span className="font-jetbrains text-[9px] font-semibold tracking-wider uppercase">
            PROFIL
          </span>
        </Link>
      </div>
    </nav>
  );
}
