"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LessonPhaseExplanation from "@/components/LessonPhaseExplanation";
import LessonPhaseExercises from "@/components/LessonPhaseExercises";
import LessonPhaseRoleplay from "@/components/LessonPhaseRoleplay";
import PostLessonSummary from "@/components/PostLessonSummary";
import type { LessonCategory, LessonContent } from "@/lib/lesson-types";
import { CATEGORY_LABELS } from "@/lib/lesson-types";

type Phase = "loading" | "explanation" | "exercises" | "roleplay" | "summary";

interface Props {
  profile: { id: string; name: string; level: string; facts: string };
  initialCategory: LessonCategory;
}

const PHASE_LABELS: Record<Phase, string> = {
  loading: "Wird geladen…",
  explanation: "Erklärung",
  exercises: "Übungen",
  roleplay: "Rollenspiel",
  summary: "Zusammenfassung",
};

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export default function LessonScreen({ profile, initialCategory }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [explanationStep, setExplanationStep] = useState(0);
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  // Stores a callback that stops current audio and resolves the playAudioBuffer promise
  const skipAudioRef = useRef<(() => void) | null>(null);

  // Create persistent audio element on mount
  useEffect(() => {
    const el = new Audio();
    el.setAttribute("playsinline", "");
    audioElRef.current = el;
  }, []);

  // Unlock audio on any user interaction
  function unlockAudio() {
    const el = audioElRef.current;
    if (el && !el.dataset.unlocked) {
      el.muted = true;
      el.src = "/silence.wav";
      el.play().then(() => {
        el.pause();
        el.muted = false;
        el.dataset.unlocked = "1";
      }).catch(() => {});
    }
  }

  // Stop current audio immediately and resolve the pending playAudioBuffer promise
  const stopAudio = useCallback(() => {
    if (skipAudioRef.current) {
      skipAudioRef.current();
      skipAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const playAudioBuffer = useCallback(async (arrayBuffer: ArrayBuffer): Promise<void> => {
    return new Promise((resolve) => {
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const el = audioElRef.current ?? new Audio();

      const done = () => {
        URL.revokeObjectURL(url);
        skipAudioRef.current = null;
        resolve();
      };

      // Store skip callback so stopAudio() can terminate playback early
      skipAudioRef.current = () => {
        el.pause();
        done();
      };

      el.onended = done;
      el.onerror = done;
      el.src = url;
      el.play().catch(done);
    });
  }, []);

  const speakText = useCallback(async (text: string) => {
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        await playAudioBuffer(buf);
      }
    } finally {
      setIsSpeaking(false);
    }
  }, [playAudioBuffer]);

  // Load lesson on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/lektion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: profile.id, category: initialCategory }),
        });
        if (!res.ok) throw new Error("Failed to generate lesson");
        const data = await res.json() as { lesson: LessonContent };
        setLesson(data.lesson);
        setPhase("explanation");
        speakText(data.lesson.explanationSteps[0].text);
      } catch {
        setError("Lektion konnte nicht geladen werden. Bitte versuche es erneut.");
      }
    })();
  }, [profile.id, initialCategory, speakText]);

  const handleExplanationNext = () => {
    if (!lesson) return;
    stopAudio(); // stop speaking if still playing
    const nextStep = explanationStep + 1;
    if (nextStep >= lesson.explanationSteps.length) {
      setPhase("exercises");
    } else {
      setExplanationStep(nextStep);
      speakText(lesson.explanationSteps[nextStep].text);
    }
  };

  const handleExerciseAnswer = (correct: boolean) => {
    if (correct) setScore((s) => s + 1);
  };

  const categoryLabel = lesson?.categoryLabel ?? CATEGORY_LABELS[initialCategory] ?? initialCategory;

  return (
    <div
      className="flex flex-col h-screen bg-parchment overflow-hidden"
      onPointerDown={unlockAudio}
      onTouchStart={unlockAudio}
    >
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-cream border-b border-border-warm">
        <button
          onClick={() => { stopAudio(); router.back(); }}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-brown hover:text-forest hover:bg-border-warm/40 transition-colors"
        >
          <IconArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="font-playfair font-bold text-forest text-sm">
            {lesson?.ruleHeadline ?? `Lektion: ${categoryLabel}`}
          </span>
          {phase !== "loading" && (
            <span className="font-jetbrains text-[9px] text-muted-brown tracking-widest uppercase">
              {PHASE_LABELS[phase]}
            </span>
          )}
        </div>

        <div className="w-9" />
      </header>

      {/* Loading */}
      {phase === "loading" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 rounded-full bg-forest flex items-center justify-center animate-pulse">
            <span className="font-playfair font-bold text-xl text-gold leading-none">M</span>
          </div>
          <p className="font-jetbrains text-[11px] text-muted-brown tracking-widest uppercase">
            Max bereitet deine Lektion vor…
          </p>
        </div>
      )}

      {error && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <p className="font-source-serif text-correction-red text-center">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-forest text-cream font-jetbrains text-xs rounded-2xl"
          >
            Zurück
          </button>
        </div>
      )}

      {/* Explanation phase */}
      {phase === "explanation" && lesson && (
        <LessonPhaseExplanation
          steps={lesson.explanationSteps}
          currentStep={explanationStep}
          isSpeaking={isSpeaking}
          isLast={explanationStep === lesson.explanationSteps.length - 1}
          onNext={handleExplanationNext}
          onSkip={stopAudio}
        />
      )}

      {/* Exercises phase */}
      {phase === "exercises" && lesson && (
        <LessonPhaseExercises
          exercises={lesson.exercises}
          isSpeaking={isSpeaking}
          onAnswer={handleExerciseAnswer}
          onComplete={() => setPhase("roleplay")}
          speakText={speakText}
        />
      )}

      {/* Roleplay phase */}
      {phase === "roleplay" && lesson && (
        <LessonPhaseRoleplay
          profileId={profile.id}
          profileName={profile.name}
          category={initialCategory}
          profile={profile}
          playAudioBuffer={playAudioBuffer}
          stopAudio={stopAudio}
          onComplete={() => setPhase("summary")}
        />
      )}

      {/* Summary */}
      {phase === "summary" && lesson && (
        <div className="flex-1 overflow-y-auto">
          <PostLessonSummary
            lesson={lesson}
            score={score}
            total={lesson.exercises.length}
            profileId={profile.id}
          />
        </div>
      )}
    </div>
  );
}
