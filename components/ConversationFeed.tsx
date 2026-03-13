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
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-none bg-parchment">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center pt-16">
          <p className="text-3xl">🇩🇪</p>
          <p className="font-source-serif italic text-muted-brown text-sm max-w-xs">
            Hallo {profileName}! Drück den Mikrofon-Knopf und sprich auf Deutsch.
          </p>
        </div>
      )}

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
                      <span className="text-muted-brown">→</span>
                      <span className="text-forest font-semibold">{c.corrected}</span>
                    </div>
                    <p className="text-xs text-muted-brown font-source-serif">💡 {c.rule}</p>
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
