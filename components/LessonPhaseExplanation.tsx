"use client";

import type { ExplanationStep } from "@/lib/lesson-types";

interface Props {
  steps: ExplanationStep[];
  currentStep: number;
  isSpeaking: boolean;
  isLast: boolean;
  onNext: () => void;
}

export default function LessonPhaseExplanation({ steps, currentStep, isSpeaking, isLast, onNext }: Props) {
  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      {/* Step counter */}
      <p className="font-jetbrains text-[10px] text-muted-brown tracking-widest uppercase mb-6">
        {currentStep + 1} / {steps.length}
      </p>

      {/* Card */}
      <div
        key={currentStep}
        className="w-full max-w-md bg-cream border border-border-warm rounded-2xl p-6 shadow-sm animate-fade-in"
      >
        {/* Max avatar + text */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-forest flex items-center justify-center shrink-0 mt-0.5">
            <span className="font-playfair font-bold text-base text-gold leading-none">M</span>
          </div>
          <p className="font-source-serif text-forest text-base leading-relaxed">{step.text}</p>
        </div>

        {/* Example sentence */}
        {step.example && (
          <div className="mt-3 bg-parchment border border-border-warm rounded-xl px-4 py-3">
            <p className="font-jetbrains text-sm text-forest">{step.example}</p>
          </div>
        )}
      </div>

      {/* Weiter button */}
      <button
        onClick={onNext}
        disabled={isSpeaking}
        className="mt-8 px-8 py-3 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl hover:brightness-110 disabled:opacity-40 transition-all tracking-wide"
      >
        {isSpeaking ? "Max spricht…" : isLast ? "Zu den Übungen →" : "Weiter →"}
      </button>
    </div>
  );
}
