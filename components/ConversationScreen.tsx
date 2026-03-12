"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import VoiceButton, { type VoiceButtonHandle } from "@/components/VoiceButton";
import ConversationFeed, { type Message, type Correction } from "@/components/ConversationFeed";
import MistakePanel from "@/components/MistakePanel";
import TopicChips from "@/components/TopicChips";

type Status = "idle" | "thinking" | "speaking";
type Tab = "voice" | "chat";

interface Profile {
  id: string;
  name: string;
  level: string;
  facts: string;
}

interface Props {
  profile: Profile;
}

const WAVE_HEIGHTS = [0.35, 0.6, 0.9, 0.75, 1, 0.8, 0.55, 0.85, 0.4, 0.7, 0.5];

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-1.5 h-10">
      {WAVE_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full bg-neon transition-all duration-150 ${active ? "animate-wave-bar" : ""}`}
          style={{
            height: active ? `${h * 100}%` : "25%",
            animationDelay: `${i * 65}ms`,
            animationDuration: `${550 + i * 40}ms`,
            opacity: active ? 1 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

export default function ConversationScreen({ profile }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [inputText, setInputText] = useState("");
  const [sessionCorrections, setSessionCorrections] = useState<Correction[]>([]);
  const [showMistakePanel, setShowMistakePanel] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [callMode, setCallMode] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("voice");

  const voiceButtonRef = useRef<VoiceButtonHandle>(null);
  const callModeRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function setCallModeSync(val: boolean) {
    callModeRef.current = val;
    setCallMode(val);
  }

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

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
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
        if (callModeRef.current) {
          setTimeout(() => voiceButtonRef.current?.startRecording(), 400);
        }
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

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    unlockAudio();
    sendMessage(inputText);
  }

  function startCall() {
    unlockAudio();
    setCallModeSync(true);
    setTimeout(() => voiceButtonRef.current?.startRecording(), 150);
  }

  function endCall() {
    setCallModeSync(false);
    voiceButtonRef.current?.stopRecording();
  }

  const latestAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");

  const statusLabel =
    status === "thinking"
      ? "THINKING"
      : status === "speaking"
      ? "SPEAKING"
      : callMode
      ? "LISTENING"
      : "READY";

  const statusColor =
    status === "thinking"
      ? "text-yellow-400"
      : status === "speaking"
      ? "text-blue-400"
      : "text-neon";

  return (
    <div className="flex flex-col h-screen bg-app-bg overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/5">
        <Link
          href="/"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-white font-bold text-base tracking-wide">Max</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${statusColor} animate-listening`} />
            <span className={`text-[10px] font-semibold tracking-widest ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowMistakePanel((v) => !v)}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Korrekturen anzeigen"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {sessionCorrections.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {sessionCorrections.length > 9 ? "9+" : sessionCorrections.length}
            </span>
          )}
        </button>
      </header>

      {/* ── Audio error banner ── */}
      {audioError && (
        <div className="bg-red-950/80 border-b border-red-800/50 text-red-300 text-xs px-4 py-2 flex justify-between items-center shrink-0">
          <span>🔇 {audioError}</span>
          <button onClick={() => setAudioError(null)} className="ml-2 text-red-500 hover:text-red-300">✕</button>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* VOICE TAB */}
        {activeTab === "voice" && (
          <div className="flex-1 flex flex-col items-center justify-between py-4 px-4 overflow-hidden">

            {/* Max avatar + rings */}
            <div className="flex flex-col items-center gap-5 flex-1 justify-center">
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute rounded-full border border-neon/8 animate-ring-pulse"
                  style={{ width: 220, height: 220, animationDelay: "0.6s", animationDuration: "3s" }}
                />
                <div
                  className="absolute rounded-full border border-neon/15 animate-ring-pulse"
                  style={{ width: 180, height: 180, animationDelay: "0.3s", animationDuration: "2.8s" }}
                />
                <div
                  className="absolute rounded-full border border-neon/30 animate-ring-pulse"
                  style={{ width: 148, height: 148, animationDuration: "2.5s" }}
                />
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center z-10 border-2 border-neon/50 neon-glow-sm"
                  style={{ background: "radial-gradient(circle at 38% 32%, #1a2e1a, #060a06)" }}
                >
                  <span
                    className="text-5xl font-black text-neon select-none"
                    style={{ textShadow: "0 0 20px rgba(74,222,128,0.6)" }}
                  >
                    M
                  </span>
                </div>
              </div>

              {/* Waveform */}
              <WaveformBars active={status === "speaking" || callMode} />

              {/* MAX IS SAYING card */}
              <div className="w-full max-w-xs rounded-2xl p-4 card-dark">
                <p className="text-neon text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                  Max Is Saying
                </p>
                <p className="text-white/85 text-sm italic leading-relaxed">
                  {latestAssistantMsg
                    ? `"${latestAssistantMsg.content}"`
                    : `"Guten Tag, ${profile.name}! Wie kann ich dir heute mit deinem Deutsch helfen?"`}
                </p>
              </div>
            </div>

            {/* Topic chips */}
            {!callMode && status === "idle" && (
              <div className="w-full max-w-sm mb-2">
                <TopicChips onSelect={sendMessage} disabled={false} />
              </div>
            )}

            {/* Call status */}
            {callMode && (
              <p className="text-xs text-white/40 mb-1">
                {status === "speaking"
                  ? "Max spricht…"
                  : status === "thinking"
                  ? "Max denkt…"
                  : "Zuhören…"}
              </p>
            )}

            {/* Mic + call button */}
            <div
              className="flex flex-col items-center gap-3 mb-2"
              onPointerDown={unlockAudio}
              onTouchStart={unlockAudio}
            >
              <VoiceButton
                ref={voiceButtonRef}
                onTranscript={sendMessage}
                disabled={status !== "idle"}
                autoMode={callMode}
              />

              {!callMode ? (
                <button
                  onClick={startCall}
                  disabled={status !== "idle"}
                  className="flex items-center gap-2 px-5 py-2 bg-neon text-app-bg font-semibold text-xs rounded-full hover:brightness-110 disabled:opacity-40 transition-all neon-glow-sm tracking-wide"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                  </svg>
                  Gespräch starten
                </button>
              ) : (
                <button
                  onClick={endCall}
                  className="flex items-center gap-2 px-5 py-2 bg-red-600/90 text-white font-semibold text-xs rounded-full hover:bg-red-500 transition-colors tracking-wide"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.69.28-.27 0-.52-.11-.7-.29L.29 13c-.18-.18-.29-.43-.29-.69 0-.27.11-.52.29-.7C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.61c.18.18.29.43.29.7 0 .26-.11.51-.29.69l-2.5 2.56c-.18.18-.43.29-.7.29-.26 0-.51-.1-.69-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                  </svg>
                  Beenden
                </button>
              )}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ConversationFeed messages={messages} status={status} profileName={profile.name} />
            <div className="shrink-0 border-t border-white/5 px-4 py-3">
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Auf Deutsch tippen…"
                  disabled={status !== "idle"}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-neon/30 disabled:opacity-40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={status !== "idle" || !inputText.trim()}
                  className="px-4 py-2.5 bg-neon text-app-bg font-semibold text-sm rounded-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Senden
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav className="shrink-0 border-t border-white/5 bg-app-bg">
        <div className="flex items-end justify-around px-2 py-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === "chat" ? "text-neon" : "text-white/30 hover:text-white/60"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[9px] font-semibold tracking-wider uppercase">Chat</span>
          </button>

          <Link
            href={`/${profile.id}/report`}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-white/30 hover:text-white/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-[9px] font-semibold tracking-wider uppercase">Report</span>
          </Link>

          {/* Elevated centre mic */}
          <div className="-mt-5" onPointerDown={unlockAudio} onTouchStart={unlockAudio}>
            <button
              onClick={() => { setActiveTab("voice"); if (!callMode) startCall(); }}
              className="w-14 h-14 rounded-full bg-neon neon-glow flex items-center justify-center shadow-xl"
              aria-label="Gespräch starten"
            >
              <svg className="w-6 h-6 text-app-bg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a4 4 0 014 4v7a4 4 0 01-8 0V5a4 4 0 014-4zm0 2a2 2 0 00-2 2v7a2 2 0 004 0V5a2 2 0 00-2-2zm-7 9a7 7 0 0014 0h2a9 9 0 01-8 8.94V22h2v2H9v-2h2v-1.06A9 9 0 013 12h2z" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setActiveTab("voice")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
              activeTab === "voice" ? "text-neon" : "text-white/30 hover:text-white/60"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[9px] font-semibold tracking-wider uppercase">Voice</span>
          </button>

          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-white/30 hover:text-white/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[9px] font-semibold tracking-wider uppercase">Profil</span>
          </Link>
        </div>
      </nav>

      <MistakePanel
        corrections={sessionCorrections}
        isOpen={showMistakePanel}
        onClose={() => setShowMistakePanel(false)}
      />
    </div>
  );
}
