"use client";

import { useState, useRef } from "react";
import VoiceButton, { type VoiceButtonHandle } from "@/components/VoiceButton";
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
  const [callMode, setCallMode] = useState(false);

  const voiceButtonRef = useRef<VoiceButtonHandle>(null);
  const callModeRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Persistent DOM audio element — more reliable than new Audio() for autoplay
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  function setCallModeSync(val: boolean) {
    callModeRef.current = val;
    setCallMode(val);
  }

  // Must be called synchronously inside a user gesture to unlock audio
  function unlockAudio() {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    // Also trigger the DOM audio element (ensures it's "user-activated")
    if (audioElRef.current) {
      audioElRef.current.play().catch(() => {});
    }
  }

  // Plays a streaming TTS response progressively (starts playing on first chunk).
  // Falls back to buffered playback on Safari where MediaSource doesn't support audio/mpeg.
  function playTTS(response: Response): Promise<void> {
    return new Promise((resolve) => {
      const done = () => resolve();
      const el = audioElRef.current;
      if (!el) { done(); return; }

      const supportsStreaming =
        typeof MediaSource !== "undefined" &&
        MediaSource.isTypeSupported("audio/mpeg");

      if (supportsStreaming && response.body) {
        // Progressive playback via MediaSource — starts on first chunk
        const ms = new MediaSource();
        const url = URL.createObjectURL(ms);

        ms.addEventListener("sourceopen", async () => {
          let sb: SourceBuffer;
          try {
            sb = ms.addSourceBuffer("audio/mpeg");
          } catch {
            // Codec rejected — fall back
            URL.revokeObjectURL(url);
            response.arrayBuffer().then((buf) => playBuffered(buf, el, done)).catch(() => done());
            return;
          }

          const reader = response.body!.getReader();
          let playStarted = false;

          const appendNext = async () => {
            try {
              const { done: streamDone, value } = await reader.read();
              if (streamDone) {
                if (!sb.updating) ms.endOfStream();
                else sb.addEventListener("updateend", () => ms.endOfStream(), { once: true });
                return;
              }
              if (sb.updating) {
                await new Promise<void>((r) => sb.addEventListener("updateend", () => r(), { once: true }));
              }
              sb.appendBuffer(value);
              if (!playStarted) {
                playStarted = true;
                el.play().catch(() => {});
              }
              sb.addEventListener("updateend", appendNext, { once: true });
            } catch { done(); }
          };

          appendNext();
        }, { once: true });

        el.onended = () => { URL.revokeObjectURL(url); done(); };
        el.onerror = () => { URL.revokeObjectURL(url); done(); };
        el.src = url;
      } else {
        // Safari fallback: buffer the whole thing then play
        response.arrayBuffer()
          .then((buf) => playBuffered(buf, el, done))
          .catch(() => done());
      }
    });
  }

  function playBuffered(arrayBuffer: ArrayBuffer, el: HTMLAudioElement, done: () => void) {
    const bufCopy = arrayBuffer.slice(0);
    // Try AudioContext first
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      Promise.resolve(ctx.state === "suspended" ? ctx.resume() : undefined)
        .then(() => ctx.decodeAudioData(arrayBuffer))
        .then((decoded) => {
          const source = ctx.createBufferSource();
          source.buffer = decoded;
          source.connect(ctx.destination);
          source.onended = done;
          source.start(0);
        })
        .catch(() => playViaElement(bufCopy, el, done));
    } else {
      playViaElement(bufCopy, el, done);
    }
  }

  function playViaElement(arrayBuffer: ArrayBuffer, el: HTMLAudioElement, done: () => void) {
    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    el.onended = () => { URL.revokeObjectURL(url); done(); };
    el.onerror = () => { URL.revokeObjectURL(url); done(); };
    el.src = url;
    el.load();
    el.play().catch(() => { URL.revokeObjectURL(url); done(); });
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

      // Fetch and play TTS
      setStatus("speaking");
      const speakRes = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chatData.reply }),
      });

      if (speakRes.ok) {
        await playTTS(speakRes);
      }

      // After audio finishes (or if speak failed), go idle and auto-listen in call mode
      setStatus("idle");
      if (callModeRef.current) {
        setTimeout(() => voiceButtonRef.current?.startRecording(), 400);
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

  const callStatusLabel =
    status === "thinking" ? "Max denkt…" :
    status === "speaking" ? "Max spricht…" :
    "Zuhören…";

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      {/* Hidden persistent audio element for reliable playback */}
      <audio ref={audioElRef} style={{ display: "none" }} />

      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-200 ${showMistakePanel ? "md:mr-72" : ""}`}>
        <ConversationFeed messages={messages} status={status} profileName={profile.name} />

        {/* Input area */}
        <div className="border-t border-gray-800 bg-gray-950 px-4 pt-3 pb-4 shrink-0">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-3">

            {!callMode && (
              <TopicChips onSelect={(t) => { unlockAudio(); sendMessage(t); }} disabled={status !== "idle"} />
            )}

            {callMode && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className={`w-2 h-2 rounded-full ${
                  status === "speaking" ? "bg-blue-400 animate-pulse" :
                  status === "thinking" ? "bg-yellow-400 animate-pulse" :
                  "bg-green-400 animate-pulse"
                }`} />
                {callStatusLabel}
              </div>
            )}

            {/* Voice button row */}
            <div className="flex items-center justify-center w-full gap-4">
              <div className="w-10" />

              <div onPointerDown={unlockAudio} onTouchStart={unlockAudio}>
                <VoiceButton
                  ref={voiceButtonRef}
                  onTranscript={sendMessage}
                  disabled={status !== "idle"}
                  autoMode={callMode}
                />
              </div>

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

            {/* Start / End Call */}
            {!callMode ? (
              <button
                onClick={startCall}
                disabled={status !== "idle"}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                </svg>
                Gespräch starten
              </button>
            ) : (
              <button
                onClick={endCall}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.69.28-.27 0-.52-.11-.7-.29L.29 13c-.18-.18-.29-.43-.29-.69 0-.27.11-.52.29-.7C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.61c.18.18.29.43.29.7 0 .26-.11.51-.29.69l-2.5 2.56c-.18.18-.43.29-.7.29-.26 0-.51-.1-.69-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                </svg>
                Gespräch beenden
              </button>
            )}

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

      <MistakePanel
        corrections={sessionCorrections}
        isOpen={showMistakePanel}
        onClose={() => setShowMistakePanel(false)}
      />
    </div>
  );
}
