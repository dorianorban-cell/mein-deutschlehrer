"use client";

import { useEffect, useRef } from "react";

export interface Correction {
  original: string;
  corrected: string;
  rule: string;
  category: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  corrections?: Correction[];
}

type Status = "idle" | "thinking" | "speaking";

interface Props {
  messages: Message[];
  status: Status;
  profileName: string;
}

// ── Illustrated Max SVG character ───────────────────────────
function MaxIllustration({ speaking }: { speaking: boolean }) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={`w-24 h-28 ${speaking ? "animate-bounce" : ""}`}
      style={speaking ? { animationDuration: "2s" } : {}}
      aria-label="Max, dein Deutschlehrer"
    >
      {/* Shadow */}
      <ellipse cx="50" cy="115" rx="22" ry="5" fill="#C8A96E" opacity="0.25" />

      {/* Body — casual hoodie */}
      <rect x="26" y="72" width="48" height="42" rx="12" fill="#2D5A3D" />
      {/* Hoodie kangaroo pocket */}
      <rect x="36" y="88" width="28" height="14" rx="6" fill="#1A3A2A" opacity="0.5" />
      {/* Hoodie drawstrings */}
      <line x1="45" y1="74" x2="43" y2="87" stroke="#1A3A2A" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
      <line x1="55" y1="74" x2="57" y2="87" stroke="#1A3A2A" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />

      {/* Neck */}
      <rect x="44" y="62" width="12" height="14" rx="5" fill="#d4a574" />

      {/* Head */}
      <ellipse cx="50" cy="47" rx="22" ry="24" fill="#d4a574" />

      {/* Bold hair — sandy/dirty-blonde, lots of volume */}
      <ellipse cx="50" cy="24" rx="24" ry="13" fill="#9B6E3A" />
      <rect x="26" y="24" width="48" height="10" fill="#9B6E3A" />
      {/* Full side hair */}
      <rect x="25" y="28" width="8" height="20" rx="5" fill="#9B6E3A" />
      <rect x="67" y="28" width="8" height="20" rx="5" fill="#9B6E3A" />
      {/* Hair volume highlights */}
      <ellipse cx="40" cy="21" rx="9" ry="6" fill="#B8854A" opacity="0.55" />
      <ellipse cx="62" cy="20" rx="8" ry="5" fill="#B8854A" opacity="0.45" />

      {/* Ears */}
      <ellipse cx="28" cy="49" rx="4" ry="5" fill="#c89a6a" />
      <ellipse cx="72" cy="49" rx="4" ry="5" fill="#c89a6a" />

      {/* Eyebrows — natural, slightly thick */}
      <path d="M34 42 Q39 40 44 41" fill="none" stroke="#7A4E28" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M56 41 Q61 40 66 42" fill="none" stroke="#7A4E28" strokeWidth="2.2" strokeLinecap="round" />

      {/* Eyes — no glasses, open friendly */}
      <ellipse cx="39" cy="48" rx="4.5" ry="3.5" fill="#1A3A2A" />
      <ellipse cx="61" cy="48" rx="4.5" ry="3.5" fill="#1A3A2A" />
      {/* Eye shine */}
      <circle cx="41" cy="46.5" r="1.3" fill="white" />
      <circle cx="63" cy="46.5" r="1.3" fill="white" />

      {/* Relaxed smile */}
      <path d="M43 58 Q50 64 57 58" fill="none" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" />

      {/* Light chin stubble */}
      <ellipse cx="50" cy="62" rx="7" ry="2.5" fill="#c09070" opacity="0.25" />

      {/* Arms — hoodie sleeves */}
      <rect x="12" y="74" width="16" height="9" rx="5" fill="#2D5A3D" />
      <rect x="72" y="74" width="16" height="9" rx="5" fill="#2D5A3D" />
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

// ── Welcome screen ───────────────────────────────────────────
function WelcomeScreen({ profileName, speaking }: { profileName: string; speaking: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 pt-6 pb-2">
      <MaxIllustration speaking={speaking} />

      {/* Speech bubble */}
      <div className="relative bg-cream border border-border-warm rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm max-w-xs w-full">
        {/* Bubble tail */}
        <div className="absolute -top-2 left-6 w-4 h-4 bg-cream border-t border-l border-border-warm rotate-45" />
        <p className="font-playfair text-forest text-sm leading-relaxed relative z-10">
          &ldquo;Guten Tag, {profileName}! Ich bin bereit. Worüber möchtest du heute sprechen?&rdquo;
        </p>
        {speaking && (
          <div className="flex gap-1 mt-2">
            <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>

      <p className="font-jetbrains text-[10px] text-muted-brown tracking-widest uppercase mt-1">
        Drück den Mikrofon-Knopf unten
      </p>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────
export default function ConversationFeed({ messages, status, profileName }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-none bg-parchment">
        <WelcomeScreen profileName={profileName} speaking={status !== "idle"} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-none bg-parchment">
      {messages.map((msg, i) => (
        <div key={i} className="space-y-2">
          <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-forest flex items-center justify-center mr-2 mt-0.5 shrink-0">
                <span className="font-playfair font-bold text-xs text-gold leading-none">M</span>
              </div>
            )}
            <div
              className={`
                max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === "user"
                  ? "bg-forest text-cream rounded-tr-sm shadow-sm"
                  : "bg-cream border border-border-warm text-forest rounded-tl-sm shadow-sm"
                }
              `}
            >
              {msg.content}
            </div>
          </div>

          {msg.role === "user" && msg.corrections && msg.corrections.length > 0 && (
            <div className="flex justify-end">
              <div className="max-w-[80%] space-y-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {msg.corrections.map((c, ci) => (
                  <div key={ci} className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap text-sm font-jetbrains">
                      <span className="text-correction-red line-through">{c.original}</span>
                      <span className="text-muted-brown">&#8594;</span>
                      <span className="text-forest font-semibold">{c.corrected}</span>
                    </div>
                    <p className="text-xs text-muted-brown font-source-serif flex items-start gap-1">
                      <IconLightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {c.rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {status !== "idle" && (
        <div className="flex justify-start">
          <div className="w-7 h-7 rounded-full bg-forest flex items-center justify-center mr-2 mt-0.5 shrink-0">
            <span className="font-playfair font-bold text-xs text-gold leading-none">M</span>
          </div>
          <div className="bg-cream border border-border-warm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="font-jetbrains text-xs text-muted-brown">
              {status === "thinking" ? "Max denkt…" : "Max spricht…"}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
