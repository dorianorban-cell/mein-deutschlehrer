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

const STATUS_LABELS: Record<Status, string> = {
  idle: "",
  thinking: "Max denkt nach…",
  speaking: "Max spricht…",
};

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
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center pt-16">
          <p className="text-4xl">🇩🇪</p>
          <p className="text-gray-400 text-sm max-w-xs">
            Hallo {profileName}! Drücke den Mikrofon-Button oder schreibe auf Deutsch.
          </p>
        </div>
      )}

      {messages.map((msg, i) => (
        <div key={i} className="space-y-1">
          {/* Message bubble */}
          <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white mr-2 mt-1 shrink-0">
                M
              </div>
            )}
            <div
              className={`
                max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === "user"
                  ? "bg-gray-700 text-white rounded-tr-sm"
                  : "bg-gray-800 text-gray-100 rounded-tl-sm"
                }
              `}
            >
              {msg.content}
            </div>
          </div>

          {/* Inline corrections block (shown after user message) */}
          {msg.role === "user" && msg.corrections && msg.corrections.length > 0 && (
            <div className="flex justify-end">
              <div className="max-w-[80%] mr-0 space-y-2 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3">
                {msg.corrections.map((c, ci) => (
                  <div key={ci} className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap text-sm font-mono">
                      <span className="text-red-400 line-through">{c.original}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-green-400">{c.corrected}</span>
                    </div>
                    <p className="text-xs text-gray-500">💡 {c.rule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Thinking / speaking indicator */}
      {status !== "idle" && (
        <div className="flex justify-start">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white mr-2 mt-1 shrink-0">
            M
          </div>
          <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-xs text-gray-400">{STATUS_LABELS[status]}</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
