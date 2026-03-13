"use client";

import { useState, useRef } from "react";
import VoiceButton, { type VoiceButtonHandle } from "@/components/VoiceButton";
import ConversationFeed, { type Message, type Correction } from "@/components/ConversationFeed";
import MistakePanel from "@/components/MistakePanel";
import BottomNav from "@/components/BottomNav";

type Status = "idle" | "thinking" | "speaking";

interface Profile {
  id: string;
  name: string;
  level: string;
  facts: string;
  streakDays: number;
}

interface Props {
  profile: Profile;
}

export default function ConversationScreen({ profile }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [sessionCorrections, setSessionCorrections] = useState<Correction[]>([]);
  const [showMistakePanel, setShowMistakePanel] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const voiceButtonRef = useRef<VoiceButtonHandle>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sessionStartRef = useRef<number | null>(null);

  function unlockAudio() {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || status !== "idle") return;
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setStatus("thinking");

    try {
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

      setMessages((prev) => [...prev, { role: "assistant", content: chatData.reply }]);

      setStatus("speaking");
      const speakRes = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chatData.reply }),
      });

      function onAudioDone() {
        setStatus("idle");
      }

      if (speakRes.ok && audioCtxRef.current) {
        try {
          const arrayBuffer = await speakRes.arrayBuffer();
          if (audioCtxRef.current.state === "suspended") {
            await audioCtxRef.current.resume();
          }
          const decoded = await audioCtxRef.current.decodeAudioData(arrayBuffer);
          const source = audioCtxRef.current.createBufferSource();
          source.buffer = decoded;
          source.connect(audioCtxRef.current.destination);
          source.onended = onAudioDone;
          source.start(0);
        } catch (e) {
          console.error("Audio playback failed:", e);
          setAudioError(`Audio error: ${String(e).slice(0, 100)}`);
          onAudioDone();
        }
      } else {
        setAudioError(`Speak ${speakRes.status} / ctx: ${!!audioCtxRef.current}`);
        onAudioDone();
      }
    } catch (err) {
      console.error("Pipeline error:", err);
      setStatus("idle");
    }
  }

  const elapsedMinutes = sessionStartRef.current
    ? Math.floor((Date.now() - sessionStartRef.current) / 60000)
    : 0;

  const statusLabel =
    status === "thinking"
      ? "MAX DENKT…"
      : status === "speaking"
      ? "MAX SPRICHT…"
      : "ONLINE";

  return (
    <div className="flex flex-col h-screen bg-parchment overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0 bg-cream border-b border-border-warm">
        {/* Max avatar */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-forest flex items-center justify-center shrink-0">
            <span className="font-playfair font-bold text-lg text-gold leading-none">M</span>
          </div>
          <div className="flex flex-col">
            <span className="font-playfair font-bold text-forest text-base leading-tight">Max</span>
            <span className="font-jetbrains text-[9px] text-muted-brown tracking-widest uppercase">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Subtitle centered */}
        <div className="hidden sm:block absolute left-1/2 -translate-x-1/2">
          <span className="font-jetbrains text-[9px] text-muted-brown tracking-widest uppercase">
            Dein Deutschlehrer
          </span>
        </div>

        {/* Corrections badge */}
        <button
          onClick={() => setShowMistakePanel((v) => !v)}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-muted-brown hover:text-forest hover:bg-border-warm/40 transition-colors"
          aria-label="Korrekturen anzeigen"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {sessionCorrections.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-correction-red rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {sessionCorrections.length > 9 ? "9+" : sessionCorrections.length}
            </span>
          )}
        </button>
      </header>

      {/* ── Audio error banner ── */}
      {audioError && (
        <div className="bg-red-50 border-b border-red-200 text-correction-red text-xs px-4 py-2 flex justify-between items-center shrink-0 font-jetbrains">
          <span>🔇 {audioError}</span>
          <button onClick={() => setAudioError(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Conversation Feed ── */}
      <ConversationFeed messages={messages} status={status} profileName={profile.name} />

      {/* ── Mic area ── */}
      <div
        className="shrink-0 bg-parchment border-t border-border-warm px-4 pt-5 pb-3 flex flex-col items-center gap-2"
        onPointerDown={unlockAudio}
        onTouchStart={unlockAudio}
      >
        <VoiceButton
          ref={voiceButtonRef}
          onTranscript={sendMessage}
          disabled={status !== "idle"}
          autoMode={true}
        />

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-1">
          <span className="font-jetbrains text-[10px] text-muted-brown">
            🔥 {profile.streakDays} {profile.streakDays === 1 ? "Tag" : "Tage"}
          </span>
          <span className="font-jetbrains text-[10px] text-muted-brown">
            ✦ {sessionCorrections.length} Fehler
          </span>
          <span className="font-jetbrains text-[10px] text-muted-brown">
            ⏱ {elapsedMinutes} Min
          </span>
        </div>
      </div>

      {/* ── Bottom nav ── */}
      <BottomNav profileId={profile.id} active="chat" />

      <MistakePanel
        corrections={sessionCorrections}
        isOpen={showMistakePanel}
        onClose={() => setShowMistakePanel(false)}
      />
    </div>
  );
}
