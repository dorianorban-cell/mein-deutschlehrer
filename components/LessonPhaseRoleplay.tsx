"use client";

import { useState, useRef } from "react";
import ConversationFeed, { type Message, type Correction } from "@/components/ConversationFeed";
import VoiceButton, { type VoiceButtonHandle } from "@/components/VoiceButton";
import { ROLEPLAY_SCENARIOS } from "@/lib/lesson-types";
import type { LessonCategory } from "@/lib/lesson-types";
import { buildRoleplaySystemPrompt } from "@/lib/prompts";

interface Props {
  profileId: string;
  profileName: string;
  category: LessonCategory;
  profile: { name: string; level: string; facts: string };
  playAudioBuffer: (buf: ArrayBuffer) => Promise<void>;
  onComplete: () => void;
}

const MAX_ROUNDS = 8;

export default function LessonPhaseRoleplay({
  profileId,
  profileName,
  category,
  profile,
  playAudioBuffer,
  onComplete,
}: Props) {
  const [scenario, setScenario] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "thinking" | "speaking">("idle");
  const [round, setRound] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const voiceButtonRef = useRef<VoiceButtonHandle>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || status !== "idle" || !scenario) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setStatus("thinking");

    const systemOverride = buildRoleplaySystemPrompt(profile, category, scenario);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text.trim(),
          profileId,
          sessionId,
          lessonSystemOverride: systemOverride,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const data = await res.json() as {
        reply: string;
        corrections: Correction[];
        sessionId: string;
      };

      if (!sessionId) setSessionId(data.sessionId);

      const newRound = round + 1;
      setRound(newRound);

      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply,
        corrections: data.corrections,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setStatus("speaking");

      const speakRes = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.reply }),
      });

      if (speakRes.ok) {
        const buf = await speakRes.arrayBuffer();
        await playAudioBuffer(buf);
      }

      // End after MAX_ROUNDS or if Max signals end
      if (newRound >= MAX_ROUNDS || data.reply.includes("Lektion beendet")) {
        setTimeout(onComplete, 1000);
      }
    } catch (err) {
      console.error("Roleplay error:", err);
    } finally {
      setStatus("idle");
    }
  };

  // Scenario picker
  if (!scenario) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <p className="font-playfair text-forest text-xl font-semibold text-center mb-2">
          Wähle ein Thema
        </p>
        <p className="font-source-serif text-muted-brown text-sm text-center mb-8">
          Max führt ein Gespräch mit dir über dieses Thema und korrigiert deine Grammatik.
        </p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {ROLEPLAY_SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenario(s.label)}
              className="bg-cream border-2 border-border-warm rounded-2xl px-4 py-5 text-center font-playfair text-forest text-sm font-semibold hover:border-forest hover:bg-parchment transition-all"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Round indicator */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-cream border-b border-border-warm">
        <span className="font-jetbrains text-[10px] text-muted-brown tracking-widest uppercase">
          Rollenspiel: {scenario}
        </span>
        <span className="font-jetbrains text-[10px] text-muted-brown">
          Runde {round} / {MAX_ROUNDS}
        </span>
      </div>

      <ConversationFeed messages={messages} status={status} profileName={profileName} />

      {/* Mic controls */}
      <div
        className="shrink-0 flex items-center justify-center gap-4 px-4 py-4 bg-parchment border-t border-border-warm"
        onPointerDown={() => {}}
      >
        <VoiceButton
          ref={voiceButtonRef}
          onTranscript={sendMessage}
          disabled={status !== "idle"}
          autoMode={true}
        />
      </div>
    </div>
  );
}
