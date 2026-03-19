"use client";

import { useState } from "react";
import VoiceButton from "@/components/VoiceButton";
import type { Exercise, ExerciseType } from "@/lib/lesson-types";

interface Props {
  exercises: Exercise[];
  isSpeaking: boolean;
  onAnswer: (correct: boolean) => void;
  onComplete: () => void;
}

interface CheckResult {
  correct: boolean;
  feedback: string;
}

const TYPE_LABELS: Record<ExerciseType, string> = {
  fill_blank: "Lückentext",
  multiple_choice: "Auswahl",
  fix_sentence: "Korrigieren",
  voice_answer: "Sprechen",
};

const ALL_TYPES: ExerciseType[] = ["fill_blank", "multiple_choice", "fix_sentence", "voice_answer"];

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function LessonPhaseExercises({ exercises, isSpeaking, onAnswer, onComplete }: Props) {
  // Group exercise indices by type
  const grouped = exercises.reduce((acc, ex, i) => {
    (acc[ex.type] ??= []).push(i);
    return acc;
  }, {} as Record<ExerciseType, number[]>);

  const availableTypes = ALL_TYPES.filter((t) => (grouped[t]?.length ?? 0) > 0);
  const [activeType, setActiveType] = useState<ExerciseType>(availableTypes[0]);
  // Track sub-index per type (which exercise in that type-group we're on)
  const [typeSubIdx, setTypeSubIdx] = useState<Record<string, number>>(
    Object.fromEntries(availableTypes.map((t) => [t, 0]))
  );
  // Track which global exercise indices have been answered or skipped
  const [done, setDone] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<CheckResult | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [checking, setChecking] = useState(false);

  const typeIndices = grouped[activeType] ?? [];
  const subIdx = typeSubIdx[activeType] ?? 0;
  const currentGlobalIdx = typeIndices[subIdx] ?? typeIndices[typeIndices.length - 1];
  const exercise = exercises[currentGlobalIdx];

  const doneCount = done.size;
  const totalCount = exercises.length;

  const switchType = (t: ExerciseType) => {
    setActiveType(t);
    setResult(null);
    setUserAnswer("");
  };

  const advanceType = () => {
    const nextSubIdx = subIdx + 1;
    if (nextSubIdx < typeIndices.length) {
      setTypeSubIdx((prev) => ({ ...prev, [activeType]: nextSubIdx }));
    }
    setResult(null);
    setUserAnswer("");
  };

  const handleSubmit = async (answer: string) => {
    if (checking || result) return;
    setChecking(true);
    try {
      const res = await fetch("/api/lektion/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: exercise.type,
          userAnswer: answer,
          correctAnswer: exercise.answer,
          prompt: exercise.prompt,
        }),
      });
      const data: CheckResult = await res.json();
      setResult(data);
      onAnswer(data.correct);
      setDone((prev) => new Set([...prev, currentGlobalIdx]));
    } finally {
      setChecking(false);
    }
  };

  const handleSkip = () => {
    setDone((prev) => new Set([...prev, currentGlobalIdx]));
    advanceType();
  };

  if (!exercise) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Type tabs */}
      <div className="shrink-0 px-4 pt-4 pb-2 bg-parchment border-b border-border-warm">
        <div className="flex gap-2">
          {availableTypes.map((t) => {
            const indices = grouped[t] ?? [];
            const doneInType = indices.filter((i) => done.has(i)).length;
            const isActive = t === activeType;
            return (
              <button
                key={t}
                onClick={() => switchType(t)}
                className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl transition-all text-center ${
                  isActive
                    ? "bg-forest text-cream"
                    : "bg-cream border border-border-warm text-muted-brown hover:text-forest hover:border-forest"
                }`}
              >
                <span className="font-jetbrains text-[10px] font-semibold tracking-wide">
                  {TYPE_LABELS[t]}
                </span>
                <span className={`font-jetbrains text-[9px] mt-0.5 ${isActive ? "text-cream/70" : "text-muted-brown"}`}>
                  {doneInType}/{indices.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Overall progress */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1 bg-border-warm rounded-full overflow-hidden">
            <div
              className="h-full bg-forest rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          <span className="font-jetbrains text-[10px] text-muted-brown shrink-0">
            {doneCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Exercise area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-md mx-auto w-full space-y-4">
          {/* Sub-index indicator if multiple exercises of this type */}
          {typeIndices.length > 1 && (
            <div className="flex items-center justify-between">
              <p className="font-jetbrains text-[10px] text-muted-brown tracking-widest uppercase">
                {TYPE_LABELS[activeType]} {subIdx + 1}/{typeIndices.length}
              </p>
              {subIdx > 0 && (
                <button
                  onClick={() => {
                    setTypeSubIdx((prev) => ({ ...prev, [activeType]: subIdx - 1 }));
                    setResult(null);
                    setUserAnswer("");
                  }}
                  className="font-jetbrains text-[10px] text-muted-brown hover:text-forest transition-colors"
                >
                  ← Zurück
                </button>
              )}
            </div>
          )}

          {/* Instruction */}
          <p className="font-playfair text-forest text-lg font-semibold">{exercise.instruction}</p>

          {/* Exercise body */}
          {!result && (
            <>
              {exercise.type === "fill_blank" && (
                <div className="space-y-4">
                  <div className="bg-cream border border-border-warm rounded-xl px-4 py-4 font-source-serif text-forest text-base">
                    {exercise.prompt.split("___").map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="inline-block min-w-[80px] border-b-2 border-forest mx-1 align-bottom" />
                        )}
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && userAnswer.trim() && handleSubmit(userAnswer.trim())}
                    placeholder="Antwort eingeben…"
                    className="w-full bg-cream border border-border-warm rounded-xl px-4 py-3 font-source-serif text-forest text-base placeholder-muted-brown focus:outline-none focus:border-forest"
                  />
                  <button
                    onClick={() => handleSubmit(userAnswer.trim())}
                    disabled={!userAnswer.trim() || checking}
                    className="w-full py-3 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl hover:brightness-110 disabled:opacity-40 transition-all"
                  >
                    {checking ? "Prüfe…" : "Prüfen"}
                  </button>
                </div>
              )}

              {exercise.type === "multiple_choice" && (
                <div className="grid grid-cols-2 gap-3">
                  {(exercise.options ?? []).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSubmit(opt)}
                      disabled={checking}
                      className="bg-cream border-2 border-border-warm rounded-2xl px-4 py-4 text-center font-source-serif text-forest text-sm hover:border-forest hover:bg-parchment transition-all disabled:opacity-40"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {exercise.type === "fix_sentence" && (
                <div className="space-y-4">
                  <div className="bg-cream border border-border-warm rounded-xl px-4 py-4">
                    <p className="font-source-serif text-correction-red text-base line-through opacity-70">
                      {exercise.prompt}
                    </p>
                  </div>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Korrigierter Satz…"
                    rows={3}
                    className="w-full bg-cream border border-border-warm rounded-xl px-4 py-3 font-source-serif text-forest text-base placeholder-muted-brown focus:outline-none focus:border-forest resize-none"
                  />
                  <button
                    onClick={() => handleSubmit(userAnswer.trim())}
                    disabled={!userAnswer.trim() || checking}
                    className="w-full py-3 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl hover:brightness-110 disabled:opacity-40 transition-all"
                  >
                    {checking ? "Prüfe…" : "Prüfen"}
                  </button>
                </div>
              )}

              {exercise.type === "voice_answer" && (
                <div className="space-y-4">
                  <div className="bg-cream border border-border-warm rounded-xl px-4 py-4">
                    <p className="font-source-serif text-forest text-base">{exercise.prompt}</p>
                  </div>
                  <div className="flex justify-center pt-2">
                    <VoiceButton onTranscript={(t) => handleSubmit(t)} disabled={checking} autoMode={true} />
                  </div>
                  <p className="text-center font-jetbrains text-[10px] text-muted-brown tracking-wide">
                    Sprich deine Antwort laut aus
                  </p>
                </div>
              )}

              {/* Skip */}
              <button
                onClick={handleSkip}
                className="w-full py-2 text-muted-brown font-jetbrains text-[11px] hover:text-forest transition-colors"
              >
                Überspringen →
              </button>
            </>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-3 rounded-2xl px-5 py-4 border-2 ${
                  result.correct
                    ? "bg-green-50 border-green-300 text-green-800"
                    : "bg-red-50 border-red-200 text-correction-red"
                }`}
              >
                {result.correct ? (
                  <IconCheck className="w-6 h-6 shrink-0" />
                ) : (
                  <IconX className="w-6 h-6 shrink-0" />
                )}
                <p className="font-source-serif text-sm">{result.feedback}</p>
              </div>

              {exercise.hint && (
                <div className="bg-cream border border-border-warm rounded-xl px-4 py-3">
                  <p className="font-jetbrains text-[11px] text-muted-brown">{exercise.hint}</p>
                </div>
              )}

              <button
                onClick={advanceType}
                disabled={isSpeaking}
                className="w-full py-3 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl hover:brightness-110 disabled:opacity-40 transition-all"
              >
                {isSpeaking ? "Max spricht…" : "Weiter →"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Proceed to roleplay */}
      <div className="shrink-0 px-4 py-4 border-t border-border-warm bg-parchment">
        <button
          onClick={onComplete}
          className="w-full py-3 bg-gold/20 border border-gold text-forest font-jetbrains text-xs font-semibold rounded-2xl hover:bg-gold/30 transition-all tracking-wide"
        >
          Zum Rollenspiel →
        </button>
      </div>
    </div>
  );
}
