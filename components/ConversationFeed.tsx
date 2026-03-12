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

export default function ConversationFeed({ messages, status, profileName }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 scrollbar-none">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center pt-16">
          <p className="text-3xl">🇩🇪</p>
          <p className="text-white/30 text-sm max-w-xs">
            Hallo {profileName}! Schreibe hier auf Deutsch.
          </p>
        </div>
      )}

      {messages.map((msg, i) => (
        <div key={i} className="space-y-1.5">
          <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-full border border-neon/40 flex items-center justify-center text-xs font-black text-neon mr-2 mt-0.5 shrink-0 neon-glow-sm"
                style={{ background: "radial-gradient(circle at 38% 32%, #1a2e1a, #060a06)" }}
              >
                M
              </div>
            )}
            <div
              className={`
                max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === "user"
                  ? "bg-neon/15 text-white border border-neon/20 rounded-tr-sm"
                  : "card-dark text-white/85 rounded-tl-sm"
                }
              `}
            >
              {msg.content}
            </div>
          </div>

          {msg.role === "user" && msg.corrections && msg.corrections.length > 0 && (
            <div className="flex justify-end">
              <div className="max-w-[80%] space-y-2 bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-3">
                {msg.corrections.map((c, ci) => (
                  <div key={ci} className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap text-sm font-mono">
                      <span className="text-red-400 line-through">{c.original}</span>
                      <span className="text-white/30">→</span>
                      <span className="text-neon">{c.corrected}</span>
                    </div>
                    <p className="text-xs text-white/30">💡 {c.rule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {status !== "idle" && (
        <div className="flex justify-start">
          <div
            className="w-7 h-7 rounded-full border border-neon/40 flex items-center justify-center text-xs font-black text-neon mr-2 mt-0.5 shrink-0"
            style={{ background: "radial-gradient(circle at 38% 32%, #1a2e1a, #060a06)" }}
          >
            M
          </div>
          <div className="card-dark rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-neon rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-neon rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-neon rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-xs text-white/30">
              {status === "thinking" ? "Max denkt…" : "Max spricht…"}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
