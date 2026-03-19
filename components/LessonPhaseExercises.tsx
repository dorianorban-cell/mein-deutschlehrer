"use client";

import { useState } from "react";
import VoiceButton from "@/components/VoiceButton";
import type { Exercise } from "@/lib/lesson-types";

interface Props {
  exercises: Exercise[];
  exerciseIndex: number;
  isSpeaking: boolean;
  onAnswer: (correct: boolean) => void;
  onContinue: () => void;
}

interface CheckResult {
  correct: boolean;
  feedback: string;
}

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

export default function LessonPhaseExercises({ exercises, exerciseIndex, isSpeaking, onAnswer, onContinue }: Props) {
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const exercise = exercises[exerciseIndex];
  if (!exercise) return null;

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
    } finally {
      setChecking(false);
    }
  };

  const handleContinue = () => {
    setResult(null);
    setUserAnswer("");
    onContinue();
  };

  // Progress dots
  const dots = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {exercises.map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${
            i < exerciseIndex ? "bg-forest" : i === exerciseIndex ? "bg-gold w-3 h-3" : "bg-border-warm"
          }`}
        />
      ))}
    </div>
  );

  const typeLabel: Record<string, string> = {
    fill_blank: "Lückentext",
    multiple_choice: "Mehrfachwahl",
    fix_sentence: "Satz korrigieren",
    voice_answer: "Sprachantwort",
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-6 py-6 overflow-y-auto">
      {dots}

      <div className="w-full max-w-md">
        {/* Type label */}
        <p className="font-jetbrains text-[10px] text-muted-brown tracking-widest uppercase mb-3">
          {typeLabel[exercise.type] ?? exercise.type}
        </p>

        {/* Instruction */}
        <p className="font-playfair text-forest text-lg font-semibold mb-5">{exercise.instruction}</p>

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
              onClick={handleContinue}
              disabled={isSpeaking}
              className="w-full py-3 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl hover:brightness-110 disabled:opacity-40 transition-all"
            >
              {isSpeaking ? "Max spricht…" : "Weiter →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
