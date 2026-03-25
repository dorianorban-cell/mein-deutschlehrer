"use client";

import { useState } from "react";
import VoiceButton from "@/components/VoiceButton";
import type { Exercise, ExerciseType, SessionPhase } from "@/lib/lesson-types";

interface Props {
  exercises: Exercise[];
  isSpeaking: boolean;
  onAnswer: (correct: boolean) => void;
  onComplete: () => void;
  speakText?: (text: string) => Promise<void>;
}

interface CheckResult {
  correct: boolean;
  feedback: string;
}

const TYPE_LABELS: Partial<Record<ExerciseType, string>> = {
  fill_blank: "Lückentext",
  multiple_choice: "Auswahl",
  fix_sentence: "Korrigieren",
  voice_answer: "Sprechen",
  spaced_replay: "Erinnerung",
  cloze_listen: "Zuhören",
  translation: "Übersetzen",
  sentence_mutation: "Formen",
};

const PHASE_LABELS: Record<SessionPhase, string> = {
  warmup: "Aufwärmen",
  practice: "Üben",
  output: "Produzieren",
};

const PHASE_ORDER: SessionPhase[] = ["warmup", "practice", "output"];

const ALL_TYPES: ExerciseType[] = [
  "spaced_replay", "cloze_listen", "fill_blank", "multiple_choice",
  "fix_sentence", "translation", "sentence_mutation", "voice_answer",
];

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

function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconSpeaker({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536A5 5 0 008 12a5 5 0 00.464 2.536M6.343 6.343A8 8 0 005 12a8 8 0 001.343 4.657" />
    </svg>
  );
}

export default function LessonPhaseExercises({ exercises, isSpeaking, onAnswer, onComplete, speakText }: Props) {
  const grouped = exercises.reduce((acc, ex, i) => {
    (acc[ex.type] ??= []).push(i);
    return acc;
  }, {} as Record<ExerciseType, number[]>);

  const availableTypes = ALL_TYPES.filter((t) => (grouped[t]?.length ?? 0) > 0);
  const [activeType, setActiveType] = useState<ExerciseType>(availableTypes[0]);
  const [typeSubIdx, setTypeSubIdx] = useState<Record<string, number>>(
    Object.fromEntries(availableTypes.map((t) => [t, 0]))
  );
  const [done, setDone] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<CheckResult | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  // sentence_mutation sub-step (0–4)
  const [mutationStep, setMutationStep] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(false);
  // spaced_replay: show answer phase
  const [showSpacedAnswer, setShowSpacedAnswer] = useState(false);

  const typeIndices = grouped[activeType] ?? [];
  const subIdx = typeSubIdx[activeType] ?? 0;
  const currentGlobalIdx = typeIndices[subIdx] ?? typeIndices[typeIndices.length - 1];
  const exercise = exercises[currentGlobalIdx];

  const doneCount = done.size;
  const totalCount = exercises.length;

  // Determine current session phase from active exercise
  const currentPhase: SessionPhase = exercise?.phase ?? "practice";

  const switchType = (t: ExerciseType) => {
    setActiveType(t);
    setResult(null);
    setUserAnswer("");
    setMutationStep(0);
    setShowSpacedAnswer(false);
  };

  const advanceType = () => {
    setResult(null);
    setUserAnswer("");
    setMutationStep(0);
    setShowSpacedAnswer(false);
    const nextSubIdx = subIdx + 1;
    if (nextSubIdx < typeIndices.length) {
      setTypeSubIdx((prev) => ({ ...prev, [activeType]: nextSubIdx }));
    } else {
      const nextType = availableTypes.find(
        (t) => t !== activeType && (grouped[t] ?? []).some((i) => !done.has(i))
      );
      if (nextType) setActiveType(nextType);
    }
  };

  const handleSubmit = async (answer: string) => {
    if (checking || result) return;
    setChecking(true);
    try {
      // sentence_mutation: check individual mutation step
      const effectivePrompt =
        exercise.type === "sentence_mutation"
          ? `${exercise.mutations?.[mutationStep] ?? exercise.prompt} (Basissatz: "${exercise.prompt}")`
          : exercise.prompt;
      const effectiveAnswer =
        exercise.type === "sentence_mutation"
          ? (exercise.mutationAnswers?.[mutationStep] ?? exercise.answer)
          : exercise.answer;

      const res = await fetch("/api/lektion/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: exercise.type,
          userAnswer: answer,
          correctAnswer: effectiveAnswer,
          prompt: effectivePrompt,
        }),
      });
      const data: CheckResult = await res.json();
      setResult(data);
      onAnswer(data.correct);

      // sentence_mutation: only mark done when all 5 steps complete
      if (exercise.type !== "sentence_mutation") {
        setDone((prev) => new Set([...prev, currentGlobalIdx]));
      }
    } finally {
      setChecking(false);
    }
  };

  const handleMutationNext = () => {
    const nextStep = mutationStep + 1;
    if (nextStep < (exercise.mutations?.length ?? 5)) {
      setMutationStep(nextStep);
      setResult(null);
      setUserAnswer("");
    } else {
      // All 5 mutations done
      setDone((prev) => new Set([...prev, currentGlobalIdx]));
      advanceType();
    }
  };

  const handleSkip = () => {
    const newDone = new Set([...done, currentGlobalIdx]);
    setDone(newDone);
    setResult(null);
    setUserAnswer("");
    setMutationStep(0);
    setShowSpacedAnswer(false);

    const nextSubIdx = subIdx + 1;
    if (nextSubIdx < typeIndices.length) {
      setTypeSubIdx((prev) => ({ ...prev, [activeType]: nextSubIdx }));
    } else {
      const nextType = availableTypes.find(
        (t) => t !== activeType && (grouped[t] ?? []).some((i) => !newDone.has(i))
      );
      if (nextType) setActiveType(nextType);
    }
  };

  const handlePlayAudio = async () => {
    if (!speakText || !exercise.audioText || playingAudio) return;
    setPlayingAudio(true);
    await speakText(exercise.audioText);
    setPlayingAudio(false);
  };

  if (!exercise) return null;

  // Phase progress indicator
  const exercisePhases = Array.from(new Set(exercises.map((e) => e.phase ?? "practice")));
  const orderedPhases = PHASE_ORDER.filter((p) => exercisePhases.includes(p));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Type tabs */}
      <div className="shrink-0 px-4 pt-4 pb-2 bg-parchment border-b border-border-warm">
        <div className="flex gap-1.5 flex-wrap">
          {availableTypes.map((t) => {
            const indices = grouped[t] ?? [];
            const doneInType = indices.filter((i) => done.has(i)).length;
            const isActive = t === activeType;
            return (
              <button
                key={t}
                onClick={() => switchType(t)}
                className={`flex-1 min-w-0 flex flex-col items-center py-2 px-1 rounded-xl transition-all text-center ${
                  isActive
                    ? "bg-forest text-cream"
                    : "bg-cream border border-border-warm text-muted-brown hover:text-forest hover:border-forest"
                }`}
              >
                <span className="font-jetbrains text-[9px] font-semibold tracking-wide truncate">
                  {TYPE_LABELS[t] ?? t}
                </span>
                <span className={`font-jetbrains text-[8px] mt-0.5 ${isActive ? "text-cream/70" : "text-muted-brown"}`}>
                  {doneInType}/{indices.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Phase indicator */}
        {orderedPhases.length > 1 && (
          <div className="flex items-center gap-2 mt-2">
            {orderedPhases.map((p, pi) => (
              <div key={p} className="flex items-center gap-1.5">
                {pi > 0 && <div className="w-3 h-px bg-border-warm" />}
                <span className={`font-jetbrains text-[9px] ${p === currentPhase ? "text-forest font-semibold" : "text-muted-brown"}`}>
                  {PHASE_LABELS[p]}
                </span>
              </div>
            ))}
          </div>
        )}

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
          {typeIndices.length > 1 && (
            <div className="flex items-center justify-between">
              <p className="font-jetbrains text-[10px] text-muted-brown tracking-widest uppercase">
                {TYPE_LABELS[activeType]} {subIdx + 1}/{typeIndices.length}
              </p>
              {subIdx > 0 && (
                <button
                  onClick={() => { setTypeSubIdx((prev) => ({ ...prev, [activeType]: subIdx - 1 })); setResult(null); setUserAnswer(""); }}
                  className="font-jetbrains text-[10px] text-muted-brown hover:text-forest transition-colors"
                >
                  ← Zurück
                </button>
              )}
            </div>
          )}

          {/* Instruction */}
          <p className="font-playfair text-forest text-lg font-semibold">{exercise.instruction}</p>

          {/* ── Exercise body ── */}
          {!result && (
            <>
              {/* SPACED REPLAY */}
              {exercise.type === "spaced_replay" && (
                <div className="space-y-4">
                  {exercise.context && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <p className="font-source-serif text-amber-800 text-sm italic">{exercise.context}</p>
                    </div>
                  )}
                  {!showSpacedAnswer ? (
                    <>
                      <div className="bg-cream border border-border-warm rounded-xl px-4 py-4">
                        <p className="font-source-serif text-correction-red text-base line-through opacity-70">
                          {exercise.prompt}
                        </p>
                      </div>
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Wie wäre es richtig?"
                        rows={2}
                        className="w-full bg-cream border border-border-warm rounded-xl px-4 py-3 font-source-serif text-forest text-base placeholder-muted-brown focus:outline-none focus:border-forest resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmit(userAnswer.trim())}
                          disabled={!userAnswer.trim() || checking}
                          className="flex-1 py-3 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl hover:brightness-110 disabled:opacity-40 transition-all"
                        >
                          {checking ? "Prüfe…" : "Prüfen"}
                        </button>
                        <button
                          onClick={() => setShowSpacedAnswer(true)}
                          className="px-4 py-3 bg-cream border border-border-warm text-muted-brown font-jetbrains text-xs rounded-2xl hover:border-forest hover:text-forest transition-all"
                        >
                          Zeig Antwort
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-4">
                        <p className="font-source-serif text-green-800 text-base font-medium">{exercise.answer}</p>
                      </div>
                      {exercise.hint && (
                        <p className="font-jetbrains text-[11px] text-muted-brown">{exercise.hint}</p>
                      )}
                      <button
                        onClick={advanceType}
                        className="w-full py-3 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl hover:brightness-110 transition-all"
                      >
                        Weiter →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CLOZE LISTEN */}
              {exercise.type === "cloze_listen" && (
                <div className="space-y-4">
                  <button
                    onClick={handlePlayAudio}
                    disabled={playingAudio || !speakText}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-jetbrains text-xs font-semibold ${
                      playingAudio
                        ? "bg-forest/20 border-forest text-forest"
                        : "bg-forest text-cream border-forest hover:brightness-110"
                    } disabled:opacity-50`}
                  >
                    {playingAudio ? (
                      <>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                        Max spricht…
                      </>
                    ) : (
                      <>
                        <IconPlay className="w-5 h-5" />
                        Satz anhören
                      </>
                    )}
                  </button>
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
                    placeholder="Fehlendes Wort…"
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

              {/* FILL BLANK */}
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

              {/* MULTIPLE CHOICE */}
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

              {/* FIX SENTENCE */}
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

              {/* TRANSLATION */}
              {exercise.type === "translation" && (
                <div className="space-y-4">
                  <div className="bg-cream border border-border-warm rounded-xl px-4 py-4">
                    <p className="font-source-serif text-muted-brown text-xs uppercase tracking-widest mb-1">English</p>
                    <p className="font-source-serif text-forest text-base">{exercise.prompt}</p>
                  </div>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Auf Deutsch…"
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

              {/* SENTENCE MUTATION */}
              {exercise.type === "sentence_mutation" && (
                <div className="space-y-4">
                  {/* Base sentence */}
                  <div className="bg-cream border border-border-warm rounded-xl px-4 py-3">
                    <p className="font-jetbrains text-[9px] text-muted-brown uppercase tracking-widest mb-1">Basissatz</p>
                    <p className="font-source-serif text-forest text-base">{exercise.prompt}</p>
                  </div>
                  {/* Mutation step indicator */}
                  <div className="flex gap-1">
                    {(exercise.mutations ?? []).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1 rounded-full transition-all ${
                          i < mutationStep ? "bg-forest" : i === mutationStep ? "bg-gold" : "bg-border-warm"
                        }`}
                      />
                    ))}
                  </div>
                  {/* Current mutation task */}
                  <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3">
                    <p className="font-jetbrains text-[10px] text-muted-brown uppercase tracking-widest mb-1">
                      Aufgabe {mutationStep + 1} von {exercise.mutations?.length ?? 5}
                    </p>
                    <p className="font-playfair text-forest text-base font-semibold">
                      {exercise.mutations?.[mutationStep]}
                    </p>
                  </div>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Deine Version…"
                    rows={2}
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

              {/* VOICE ANSWER */}
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

              {/* Skip (not for spaced_replay — it has its own reveal button) */}
              {exercise.type !== "spaced_replay" && (
                <button
                  onClick={handleSkip}
                  className="w-full py-2 text-muted-brown font-jetbrains text-[11px] hover:text-forest transition-colors"
                >
                  Überspringen →
                </button>
              )}
            </>
          )}

          {/* ── Result ── */}
          {result && (
            <div className="space-y-4">
              {/* For sentence_mutation: show correct mutation answer */}
              {exercise.type === "sentence_mutation" && exercise.mutationAnswers && (
                <div className="bg-cream border border-border-warm rounded-xl px-4 py-3">
                  <p className="font-jetbrains text-[9px] text-muted-brown uppercase tracking-widest mb-1">
                    Richtige Version
                  </p>
                  <p className="font-source-serif text-forest text-base">
                    {exercise.mutationAnswers[mutationStep]}
                  </p>
                </div>
              )}

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

              {exercise.type === "sentence_mutation" ? (
                <button
                  onClick={handleMutationNext}
                  disabled={isSpeaking}
                  className="w-full py-3 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl hover:brightness-110 disabled:opacity-40 transition-all"
                >
                  {isSpeaking
                    ? "Max spricht…"
                    : mutationStep < (exercise.mutations?.length ?? 5) - 1
                    ? `Nächste Aufgabe (${mutationStep + 2}/${exercise.mutations?.length ?? 5}) →`
                    : "Fertig →"}
                </button>
              ) : (
                <button
                  onClick={advanceType}
                  disabled={isSpeaking}
                  className="w-full py-3 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl hover:brightness-110 disabled:opacity-40 transition-all"
                >
                  {isSpeaking ? "Max spricht…" : "Weiter →"}
                </button>
              )}
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
