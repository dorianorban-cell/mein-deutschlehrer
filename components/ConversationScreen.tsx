"use client";

import { useState } from "react";
import VoiceButton from "@/components/VoiceButton";
import ConversationFeed, { type Message, type Correction } from "@/components/ConversationFeed";
import MistakePanel from "@/components/MistakePanel";
import TopicChips from "@/components/TopicChips";

type Status = "idle" | "thinking" | "speaking";

interface Profile {
  id: string;
  name: string;
  level: string;
  facts: string;
}

interface Props {
  profile: Profile;
}

export default function ConversationScreen({ profile }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [inputText, setInputText] = useState("");
  const [sessionCorrections, setSessionCorrections] = useState<Correction[]>([]);
  const [showMistakePanel, setShowMistakePanel] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || status !== "idle") return;

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setStatus("thinking");

    try {
      // 1. Get Claude's response
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text.trim(), profileId: profile.id, sessionId }),
      });

      if (!chatRes.ok) throw new Error("Chat failed");

      const chatData = await chatRes.json() as {
        reply: string;
        corrections: Correction[];
        remember: string[];
        sessionId: string;
      };

      if (!sessionId && chatData.sessionId) setSessionId(chatData.sessionId);

      // Attach corrections to the user message that triggered them
      if (chatData.corrections?.length > 0) {
        setMessages((prev) => {
          const updated = [...prev];
          const lastUserIdx = [...updated].reverse().findIndex((m) => m.role === "user");
          if (lastUserIdx !== -1) {
            const realIdx = updated.length - 1 - lastUserIdx;
            updated[realIdx] = { ...updated[realIdx], corrections: chatData.corrections };
          }
          return updated;
        });
        setSessionCorrections((prev) => [...prev, ...chatData.corrections]);
      }

      const assistantMessage: Message = { role: "assistant", content: chatData.reply };
      setMessages((prev) => [...prev, assistantMessage]);

      // 2. Play TTS audio
      setStatus("speaking");
      const speakRes = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chatData.reply }),
      });

      if (speakRes.ok) {
        const audioBlob = await speakRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        audio.onerror = () => URL.revokeObjectURL(audioUrl);
        try {
          await audio.play();
        } catch {
          // autoplay blocked or unsupported — audio won't play but that's ok
        }
        setStatus("idle"); // unlock input as soon as audio starts (or fails)
      } else {
        setStatus("idle");
      }
    } catch (err) {
      console.error("Pipeline error:", err);
      setStatus("idle");
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(inputText);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      {/* Main feed — shrinks when mistake panel is open on desktop */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-200 ${showMistakePanel ? "md:mr-72" : ""}`}>
        <ConversationFeed
          messages={messages}
          status={status}
          profileName={profile.name}
        />

        {/* Input area */}
        <div className="border-t border-gray-800 bg-gray-950 px-4 pt-3 pb-4 shrink-0">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-3">

            {/* Topic chips */}
            <TopicChips onSelect={sendMessage} disabled={status !== "idle"} />

            {/* Voice button + mistake panel toggle */}
            <div className="flex items-center justify-center w-full gap-4">
              <div className="w-10" />
              <VoiceButton onTranscript={sendMessage} disabled={status !== "idle"} />
              {/* Mistake panel toggle */}
              <button
                onClick={() => setShowMistakePanel((v) => !v)}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                aria-label="Fehler anzeigen"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {sessionCorrections.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {sessionCorrections.length > 9 ? "9+" : sessionCorrections.length}
                  </span>
                )}
              </button>
            </div>

            {/* Text fallback */}
            <form onSubmit={handleTextSubmit} className="flex w-full gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Oder hier auf Deutsch tippen…"
                disabled={status !== "idle"}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={status !== "idle" || !inputText.trim()}
                className="px-4 py-2.5 bg-white text-gray-950 font-semibold text-sm rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Senden
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mistake panel */}
      <MistakePanel
        corrections={sessionCorrections}
        isOpen={showMistakePanel}
        onClose={() => setShowMistakePanel(false)}
      />
    </div>
  );
}
