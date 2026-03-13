"use client";

import { useRef, useState, forwardRef, useImperativeHandle } from "react";

type ButtonState = "idle" | "recording" | "processing";

export interface VoiceButtonHandle {
  startRecording: () => void;
  stopRecording: () => void;
}

interface Props {
  onTranscript: (text: string) => void;
  disabled: boolean;
  autoMode?: boolean;
}

const VoiceButton = forwardRef<VoiceButtonHandle, Props>(
  ({ onTranscript, disabled, autoMode = false }, ref) => {
    const [btnState, setBtnState] = useState<ButtonState>("idle");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const recordingStartRef = useRef<number>(0);

    async function startRecording() {
      if (disabled || btnState !== "idle") return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/ogg";
        const recorder = new MediaRecorder(stream, { mimeType });
        chunksRef.current = [];
        recordingStartRef.current = Date.now();

        if (autoMode) {
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioContext = new AudioCtx();
          audioContextRef.current = audioContext;
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 2048;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const SILENCE_THRESHOLD = 8;
          const SILENCE_DURATION = 2500;
          const MIN_RECORD_TIME = 1000;
          let silenceStart: number | null = null;

          const checkSilence = () => {
            if (mediaRecorderRef.current?.state !== "recording") return;
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const v = (dataArray[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / dataArray.length) * 100;
            const elapsed = Date.now() - recordingStartRef.current;
            if (elapsed > MIN_RECORD_TIME) {
              if (rms < SILENCE_THRESHOLD) {
                if (!silenceStart) silenceStart = Date.now();
                else if (Date.now() - silenceStart > SILENCE_DURATION) {
                  stopRecording();
                  return;
                }
              } else {
                silenceStart = null;
              }
            }
            requestAnimationFrame(checkSilence);
          };
          requestAnimationFrame(checkSilence);
        }

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
          setBtnState("processing");

          const baseMimeType = mimeType.split(";")[0];
          const blob = new Blob(chunksRef.current, { type: baseMimeType });
          const ext = baseMimeType.includes("mp4") ? "mp4" : baseMimeType.includes("ogg") ? "ogg" : "webm";
          const formData = new FormData();
          formData.append("audio", blob, `recording.${ext}`);

          try {
            const res = await fetch("/api/transcribe", { method: "POST", body: formData });
            const data = await res.json();
            if (data.transcript?.trim()) onTranscript(data.transcript);
          } catch (err) {
            console.error("Transcription error:", err);
          } finally {
            setBtnState("idle");
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setBtnState("recording");
      } catch (err) {
        console.error("Microphone error:", err);
        setBtnState("idle");
      }
    }

    function stopRecording() {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }

    useImperativeHandle(ref, () => ({ startRecording, stopRecording }));

    const isDisabled = disabled || btnState === "processing";

    const clickHandlers = autoMode
      ? {
          onClick: () => {
            if (btnState === "recording") stopRecording();
            else startRecording();
          },
        }
      : {
          onPointerDown: startRecording,
          onPointerUp: stopRecording,
          onPointerLeave: stopRecording,
          onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); startRecording(); },
          onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); stopRecording(); },
        };

    const label =
      btnState === "recording"
        ? "Zuhören…"
        : btnState === "processing"
        ? "Wird verarbeitet…"
        : "Drücken zum Sprechen";

    return (
      <div className="flex flex-col items-center gap-2">
        <button
          {...clickHandlers}
          disabled={isDisabled}
          aria-label={label}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-200 select-none touch-none
            ${isDisabled && btnState !== "recording"
              ? "opacity-40 cursor-not-allowed bg-forest/20 border-2 border-forest/20"
              : btnState === "recording"
              ? "bg-correction-red scale-110 border-2 border-correction-red shadow-lg"
              : "bg-forest border-2 border-forest shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
            }
          `}
        >
          {btnState === "processing" ? (
            <svg className="w-7 h-7 text-cream animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : btnState === "recording" ? (
            <>
              <span className="absolute inset-0 rounded-full bg-correction-red animate-ping opacity-20" />
              <svg className="w-8 h-8 text-cream relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </>
          ) : (
            <svg className="w-8 h-8 text-cream" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a4 4 0 014 4v7a4 4 0 01-8 0V5a4 4 0 014-4zm0 2a2 2 0 00-2 2v7a2 2 0 004 0V5a2 2 0 00-2-2zm-7 9a7 7 0 0014 0h2a9 9 0 01-8 8.94V22h2v2H9v-2h2v-1.06A9 9 0 013 12h2z" />
            </svg>
          )}
        </button>

        <p className="font-jetbrains text-xs text-muted-brown select-none tracking-wide">
          {label}
        </p>
      </div>
    );
  }
);

VoiceButton.displayName = "VoiceButton";
export default VoiceButton;
