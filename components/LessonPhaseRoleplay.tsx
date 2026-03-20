"use client";

import { useState, useRef } from "react";
import ConversationFeed, { type Message, type Correction } from "@/components/ConversationFeed";
import VoiceButton, { type VoiceButtonHandle } from "@/components/VoiceButton";
import { ROLEPLAY_SCENARIOS } from "@/lib/lesson-types";
import type { LessonCategory, RoleplayScenario } from "@/lib/lesson-types";
import { buildRoleplaySystemPrompt } from "@/lib/prompts";

interface Props {
  profileId: string;
  profileName: string;
  category: LessonCategory;
  profile: { name: string; level: string; facts: string };
  playAudioBuffer: (buf: ArrayBuffer) => Promise<void>;
  stopAudio: () => void;
  onComplete: () => void;
}

const MAX_ROUNDS = 8;

// Concrete conversation starters per scenario
const SCENARIO_STARTERS: Record<string, string[]> = {
  gym: [
    "Hallo! Trainierst du oft hier?",
    "Hey, kannst du mir bei dieser Übung helfen?",
    "Wie lange machst du schon Sport hier?",
  ],
  store: [
    "Entschuldigung, wo finde ich die Pasta?",
    "Diese Warteschlange ist heute wirklich lang...",
    "Haben Sie dieses Produkt auch in Bio?",
  ],
  runclub: [
    "Hallo, ich bin heute zum ersten Mal hier.",
    "Wie lang ist die Strecke heute?",
    "Seit wann bist du beim Laufclub?",
  ],
  cafe: [
    "Entschuldigung, ist dieser Platz noch frei?",
    "Der Kaffee hier ist wirklich gut, oder?",
    "Arbeitest du auch hier in der Nähe?",
  ],
  job: [
    "Guten Tag! Vielen Dank, dass Sie sich Zeit nehmen.",
    "Ich interessiere mich sehr für diese Position.",
    "Könnten Sie mir mehr über das Team erzählen?",
  ],
  arzt: [
    "Guten Tag. Ich habe seit ein paar Tagen Rückenschmerzen.",
    "Ich fühle mich die letzten Tage nicht so gut.",
    "Ich habe seit gestern Abend Fieber.",
  ],
};

export default function LessonPhaseRoleplay({
  profileId,
  profileName,
  category,
  profile,
  playAudioBuffer,
  stopAudio,
  onComplete,
}: Props) {
  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);
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

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply, corrections: data.corrections }]);
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
      <div className="flex-1 flex flex-col overflow-y-auto px-6 py-8">
        <p className="font-playfair text-forest text-xl font-semibold text-center mb-2">
          Wähle eine Situation
        </p>
        <p className="font-source-serif text-muted-brown text-sm text-center mb-6">
          Max spielt die andere Person. Wähle eine Alltagssituation und übe die Grammatik direkt im Gespräch.
        </p>
        <div className="space-y-3 max-w-sm mx-auto w-full">
          {ROLEPLAY_SCENARIOS.map((s) => {
            const starters = SCENARIO_STARTERS[s.id] ?? [];
            return (
              <button
                key={s.id}
                onClick={() => setScenario(s)}
                className="w-full bg-cream border-2 border-border-warm rounded-2xl px-5 py-4 text-left hover:border-forest hover:bg-parchment transition-all"
              >
                <p className="font-playfair text-forest text-base font-semibold mb-1">{s.label}</p>
                <p className="font-source-serif text-xs text-muted-brown leading-snug mb-3">
                  {s.description.split(".")[0]}.
                </p>
                {starters.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-jetbrains text-[9px] text-muted-brown tracking-widest uppercase">
                      Mögliche Einstiege:
                    </p>
                    {starters.map((st, i) => (
                      <p key={i} className="font-source-serif text-xs text-forest/70 italic">
                        &ldquo;{st}&rdquo;
                      </p>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const starters = SCENARIO_STARTERS[scenario.id] ?? [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Round indicator */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-cream border-b border-border-warm">
        <div className="flex flex-col">
          <span className="font-jetbrains text-[10px] text-muted-brown tracking-widest uppercase">
            {scenario.label}
          </span>
          <span className="font-source-serif text-[11px] text-muted-brown italic leading-tight max-w-xs line-clamp-1">
            {scenario.description.split(".")[0]}.
          </span>
        </div>
        <span className="font-jetbrains text-[10px] text-muted-brown shrink-0">
          {round} / {MAX_ROUNDS}
        </span>
      </div>

      <ConversationFeed messages={messages} status={status} profileName={profileName} />

      {/* Starter suggestion chips — shown before first message */}
      {messages.length === 0 && status === "idle" && (
        <div className="shrink-0 px-4 py-3 border-t border-border-warm bg-cream">
          <p className="font-jetbrains text-[9px] text-muted-brown tracking-widest uppercase mb-2">
            So kannst du anfangen:
          </p>
          <div className="flex flex-col gap-1.5">
            {starters.map((st, i) => (
              <button
                key={i}
                onClick={() => sendMessage(st)}
                className="text-left px-3 py-2 bg-parchment border border-border-warm rounded-xl font-source-serif text-sm text-forest italic hover:border-forest hover:bg-forest/5 transition-colors"
              >
                &ldquo;{st}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mic controls */}
      <div className="shrink-0 bg-parchment border-t border-border-warm px-4 pt-3 pb-4">
        {/* Skip button while Max speaks */}
        {status === "speaking" && (
          <div className="flex justify-center mb-3">
            <button
              onClick={() => { stopAudio(); setStatus("idle"); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-cream border border-border-warm rounded-full font-jetbrains text-[11px] text-muted-brown hover:text-forest hover:border-forest transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Überspringen
            </button>
          </div>
        )}

        <div className="flex items-center justify-center">
          <VoiceButton
            ref={voiceButtonRef}
            onTranscript={sendMessage}
            disabled={status !== "idle"}
            autoMode={true}
          />
        </div>
      </div>
    </div>
  );
}
