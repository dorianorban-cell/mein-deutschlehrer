"use client";

import { useState, useRef, useEffect } from "react";
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

function IconFlame({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
    </svg>
  );
}

function IconDiamond({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5L2 9l10 12L22 9l-3-6zm-7 14.5L4.5 9H8l4 9zm0 0l4-9h3.5L12 17.5zM9.5 9l2.5-4 2.5 4h-5z" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function IconKeyboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path strokeLinecap="round" d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M10 14h4" />
    </svg>
  );
}

export default function ConversationScreen({ profile }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [sessionCorrections, setSessionCorrections] = useState<Correction[]>([]);
  const [showMistakePanel, setShowMistakePanel] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [autoListenMode, setAutoListenMode] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [inputText, setInputText] = useState("");

  const voiceButtonRef = useRef<VoiceButtonHandle>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const autoListenRef = useRef(false);

  // Create AudioContext and persistent <audio> element on mount
  useEffect(() => {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) audioCtxRef.current = new AudioCtx();

    const el = new Audio();
    el.setAttribute("playsinline", "");
    audioElRef.current = el;
  }, []);

  function syncAutoListen(val: boolean) {
    autoListenRef.current = val;
    setAutoListenMode(val);
  }

  // Must be called from a user-gesture handler.
  // Unlocks both WebAudio context and the persistent <audio> element (iOS Safari requires both).
  function unlockAudio() {
    // Unlock WebAudio context — must await resume() before starting the buffer
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== "running") {
      ctx.resume().then(() => {
        try {
          const buf = ctx.createBuffer(1, 1, 22050);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(0);
        } catch (_) { /* ignore */ }
      }).catch(() => {});
    }
    // Unlock persistent <audio> element — use a real silent file, not an empty WAV
    const el = audioElRef.current;
    if (el && !el.dataset.unlocked) {
      el.muted = true;
      el.src = "/silence.wav";
      el.play().then(() => {
        el.pause();
        el.muted = false;
        el.src = "";
        el.dataset.unlocked = "1";
      }).catch(() => {});
    }
  }

  // Play TTS audio. Tries Web Audio API first (unlocked via gesture), falls back to <audio> element.
  async function playAudioBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
    return new Promise(async (resolve) => {
      const ctx = audioCtxRef.current;

      // Primary: Web Audio API (works reliably after unlockAudio is called)
      if (ctx) {
        try {
          if (ctx.state !== "running") await ctx.resume();
          const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
          const source = ctx.createBufferSource();
          source.buffer = decoded;
          source.connect(ctx.destination);
          source.onended = () => resolve();
          source.start(0);
          return;
        } catch (e) {
          console.warn("WebAudio failed, trying <audio> fallback:", e);
        }
      }

      // Fallback: persistent <audio> element (unlocked on first gesture)
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const el = audioElRef.current ?? new Audio();
      el.onended = () => { URL.revokeObjectURL(url); resolve(); };
      el.onerror = (e) => {
        console.error("Audio element error:", e);
        setAudioError("Audio konnte nicht abgespielt werden — tippe zuerst auf den Mic-Button.");
        URL.revokeObjectURL(url);
        resolve();
      };
      el.src = url;
      // Do NOT call el.load() — it resets the element mid-load and causes play() to fail on iOS
      el.play().catch((e) => {
        console.error("TTS play failed:", e);
        setAudioError("Audio blockiert — tippe auf den Mic-Button und versuche es erneut.");
        URL.revokeObjectURL(url);
        resolve();
      });
    });
  }

  async function sendMessage(text: string) {
    if (!text.trim() || status !== "idle") return;
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();

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

      if (speakRes.ok) {
        try {
          const arrayBuffer = await speakRes.arrayBuffer();
          await playAudioBuffer(arrayBuffer);
        } catch (e) {
          console.error("Audio playback failed:", e);
          setAudioError(`Audio error: ${String(e).slice(0, 80)}`);
        }
      } else {
        setAudioError(`TTS ${speakRes.status}`);
      }
    } catch (err) {
      console.error("Pipeline error:", err);
    } finally {
      setStatus("idle");
      if (autoListenRef.current && !keyboardMode) {
        setTimeout(() => voiceButtonRef.current?.startRecording(), 400);
      }
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    unlockAudio();
    sendMessage(inputText);
  }

  const elapsedMinutes = sessionStartRef.current
    ? Math.floor((Date.now() - sessionStartRef.current) / 60000)
    : 0;

  const statusLabel =
    status === "thinking" ? "MAX DENKT…" : status === "speaking" ? "MAX SPRICHT…" : "ONLINE";

  return (
    <div className="flex flex-col h-screen bg-parchment overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0 bg-cream border-b border-border-warm">
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

        <div className="hidden sm:block absolute left-1/2 -translate-x-1/2">
          <span className="font-jetbrains text-[9px] text-muted-brown tracking-widest uppercase">
            Dein Deutschlehrer
          </span>
        </div>

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

      {/* Audio error */}
      {audioError && (
        <div className="bg-red-50 border-b border-red-200 text-correction-red text-xs px-4 py-2 flex justify-between items-center shrink-0 font-jetbrains">
          <span>Audio: {audioError}</span>
          <button onClick={() => setAudioError(null)} className="ml-2 opacity-60 hover:opacity-100">&#x2715;</button>
        </div>
      )}

      {/* Conversation Feed */}
      <ConversationFeed messages={messages} status={status} profileName={profile.name} />

      {/* Controls */}
      <div className="shrink-0 bg-parchment border-t border-border-warm px-4 pt-3 pb-3">

        {/* Topic chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1">
          {["Beziehungen", "Zukunft", "Psychologie", "Reisen", "Arbeit", "Musik", "Sport", "Philosophie", "Familie", "Kultur"].map((topic) => (
            <button
              key={topic}
              onClick={() => { unlockAudio(); sendMessage(`Lass uns über ${topic} sprechen.`); }}
              disabled={status !== "idle"}
              className="shrink-0 px-3 py-1 bg-cream border border-border-warm rounded-full font-jetbrains text-[11px] text-forest tracking-wide hover:border-forest hover:bg-forest hover:text-cream transition-all disabled:opacity-40"
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Button row: [auto-listen] [mic/input] [keyboard] */}
        <div
          className="flex items-end justify-center gap-5 mb-2"
          onPointerDown={unlockAudio}
          onTouchStart={unlockAudio}
        >
          {/* Auto-listen toggle */}
          <button
            onClick={() => syncAutoListen(!autoListenMode)}
            aria-label={autoListenMode ? "Auto-listen deaktivieren" : "Auto-listen aktivieren"}
            title={autoListenMode ? "Auto-listen aus" : "Auto-listen an"}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 ${
              autoListenMode
                ? "bg-forest border-forest text-cream shadow-md"
                : "bg-cream border-border-warm text-muted-brown hover:border-forest hover:text-forest"
            }`}
          >
            <IconPhone className="w-5 h-5" />
          </button>

          {/* Center: mic or keyboard input */}
          {!keyboardMode ? (
            <div className="relative flex flex-col items-center">
              <VoiceButton
                ref={voiceButtonRef}
                onTranscript={sendMessage}
                disabled={status !== "idle"}
                autoMode={true}
              />
            </div>
          ) : (
            <form onSubmit={handleTextSubmit} className="flex gap-2 flex-1 max-w-xs">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Auf Deutsch tippen…"
                disabled={status !== "idle"}
                autoFocus
                className="flex-1 bg-cream border border-border-warm rounded-xl px-3 py-2.5 text-sm text-forest placeholder-muted-brown focus:outline-none focus:border-forest disabled:opacity-40 font-source-serif"
              />
              <button
                type="submit"
                disabled={status !== "idle" || !inputText.trim()}
                className="px-4 py-2.5 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-xl hover:brightness-110 disabled:opacity-40 transition-all"
              >
                Senden
              </button>
            </form>
          )}

          {/* Keyboard toggle */}
          <button
            onClick={() => setKeyboardMode((v) => !v)}
            aria-label={keyboardMode ? "Zur Spracheingabe" : "Zur Texteingabe"}
            title={keyboardMode ? "Spracheingabe" : "Texteingabe"}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 ${
              keyboardMode
                ? "bg-forest border-forest text-cream shadow-md"
                : "bg-cream border-border-warm text-muted-brown hover:border-forest hover:text-forest"
            }`}
          >
            <IconKeyboard className="w-5 h-5" />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-5 mt-1">
          <span className="font-jetbrains text-[10px] text-muted-brown flex items-center gap-1">
            <IconFlame className="w-3 h-3 text-gold" />
            {profile.streakDays} {profile.streakDays === 1 ? "Tag" : "Tage"}
          </span>
          <span className="font-jetbrains text-[10px] text-muted-brown flex items-center gap-1">
            <IconDiamond className="w-3 h-3 text-forest" />
            {sessionCorrections.length} Fehler
          </span>
          <span className="font-jetbrains text-[10px] text-muted-brown flex items-center gap-1">
            <IconClock className="w-3 h-3" />
            {elapsedMinutes} Min
          </span>
        </div>
      </div>

      <BottomNav profileId={profile.id} active="chat" />

      <MistakePanel
        corrections={sessionCorrections}
        isOpen={showMistakePanel}
        onClose={() => setShowMistakePanel(false)}
      />
    </div>
  );
}
