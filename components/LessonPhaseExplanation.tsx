"use client";

import type { ExplanationStep } from "@/lib/lesson-types";

interface Props {
  steps: ExplanationStep[];
  currentStep: number;
  isSpeaking: boolean;
  isLast: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export default function LessonPhaseExplanation({ steps, currentStep, isSpeaking, isLast, onNext, onSkip }: Props) {
  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="shrink-0 flex items-center gap-2 px-5 pt-4 pb-2">
        <div className="flex gap-1 flex-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                i < currentStep ? "bg-forest" : i === currentStep ? "bg-gold" : "bg-border-warm"
              }`}
            />
          ))}
        </div>
        <span className="font-jetbrains text-[10px] text-muted-brown shrink-0">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 max-w-2xl mx-auto w-full">
        {/* Step heading */}
        <h2
          key={`heading-${currentStep}`}
          className="font-playfair font-bold text-forest text-xl leading-snug animate-fade-in"
        >
          {step.heading}
        </h2>

        {/* Max speaking card */}
        <div
          key={`card-${currentStep}`}
          className="bg-cream border border-border-warm rounded-2xl p-5 shadow-sm animate-fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-forest flex items-center justify-center shrink-0 mt-0.5">
              <span className="font-playfair font-bold text-base text-gold leading-none">M</span>
            </div>
            <div className="flex-1">
              <p className="font-source-serif text-forest text-base leading-relaxed">{step.text}</p>

              {/* Skip TTS button — appears while Max is speaking */}
              {isSpeaking && (
                <button
                  onClick={onSkip}
                  className="mt-2.5 flex items-center gap-1 font-jetbrains text-[10px] text-muted-brown hover:text-forest tracking-wide transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  Überspringen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Examples */}
        {step.examples && step.examples.length > 0 && (
          <div
            key={`examples-${currentStep}`}
            className="animate-fade-in"
          >
            <p className="font-jetbrains text-[10px] text-muted-brown tracking-widest uppercase mb-2">
              Beispiele
            </p>
            <div className="space-y-2">
              {step.examples.map((ex, i) => (
                <div
                  key={i}
                  className="bg-cream border-l-4 border-forest/40 rounded-r-xl px-4 py-3"
                >
                  <p className="font-source-serif text-forest text-sm leading-relaxed">{ex}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grammar table */}
        {step.table && step.table.length > 0 && (
          <div
            key={`table-${currentStep}`}
            className="animate-fade-in"
          >
            <p className="font-jetbrains text-[10px] text-muted-brown tracking-widest uppercase mb-2">
              Formen
            </p>
            <div className="rounded-xl border border-border-warm overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {step.table.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-cream" : "bg-parchment"}>
                      <td className="font-jetbrains text-[11px] text-muted-brown font-semibold px-4 py-3 border-r border-border-warm w-1/3 uppercase tracking-wide">
                        {row.label}
                      </td>
                      <td className="font-source-serif text-forest px-4 py-3">
                        {row.de}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Spacer so bottom button doesn't cover content */}
        <div className="h-4" />
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 px-4 py-4 border-t border-border-warm bg-parchment">
        <button
          onClick={onNext}
          className="w-full py-3.5 bg-forest text-cream font-jetbrains text-xs font-semibold rounded-2xl hover:brightness-110 transition-all tracking-wide"
        >
          {isLast ? "Zu den Übungen →" : "Weiter →"}
        </button>
      </div>
    </div>
  );
}
